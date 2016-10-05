'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  sinon = require('sinon'),
  Q = require('q'),
  supertest = require('supertest'),
  rewire = require('rewire'),
  config = require(root + 'common/config').getDebugConfig(),
  logger = require(root + 'common/logger'),
  Subscription = require(root + 'database/subscription'),
  RewiredHandler = rewire(root + 'handlers/subscriptions/writeSubscriptionHandler'),
  App = require(root + 'app').App;

config.api.port = 0;
config.logging.stdoutLoglevel = 'error';

describe('WriteSubscriptionHandler', function () {
  before(function () {
    this.logStub = sinon.stub(
      {
        debug: function () {},
        info: function () {},
        warn: function () {},
        error: function () {}
      }
    );

    //Subscription.initialize(this.logStub);
  });

  describe('updateFields', function () {
    before(function () {
      // prepare test data
      var subscriptionData,
        subscriptionId = '123456789012345678901234';
      this.now = new Date();
      subscriptionData = {
        name: 'test name',
        searchParameters: 'test parameters',
        lastSeason: 12,
        lastEpisode: 34,
        creationTime: this.now,
        lastModifiedTime: this.now,
        lastDownloadTime: this.now,
        lastUpdateCheckTime: this.now
      }

      // create two subscriptions with the same data - including the _id!
      this.testSubscription = new Subscription(subscriptionData);
      this.originalTestSubscription = new Subscription(subscriptionData);
      this.originalTestSubscription._id = this.testSubscription._id;

      // extract tested function
      this.updateFields = RewiredHandler.__get__('updateFields');
    });

    it('should return the original subscription if the data is not valid', function () {
      expect(this.updateFields(this.testSubscription)._doc).to.eql(this.originalTestSubscription._doc);
      expect(this.updateFields(this.testSubscription, 1234)._doc).to.eql(this.originalTestSubscription._doc);
      expect(this.updateFields(this.testSubscription, 'abcd')._doc).to.eql(this.originalTestSubscription._doc);

      expect(this.updateFields()).to.eql(undefined);
      expect(this.updateFields(null, {})).to.eql(null);
      expect(this.updateFields(1234, {})).to.eql(1234);
      expect(this.updateFields('abcd', {})).to.eql('abcd');
    });

    it('should ignore extra fields', function () {
      expect(this.updateFields(this.testSubscription, {foo: 'bar'})._doc).to.eql(this.originalTestSubscription._doc);
      expect(this.updateFields(this.testSubscription, {bar: 1234})._doc).to.eql(this.originalTestSubscription._doc);
    });

    it('should update valid fields', function () {
      var newName = 'new name',
        newSearchParameters = 'new parameters',
        newLastSeason = 56,
        newLastEpisode = 78;

      this.originalTestSubscription.name = newName;
      expect(this.updateFields(this.testSubscription, {name: newName})._doc).to.eql(this.originalTestSubscription._doc);

      this.originalTestSubscription.searchParameters = newSearchParameters;
      expect(this.updateFields(this.testSubscription, {searchParameters: newSearchParameters})._doc).to.eql(this.originalTestSubscription._doc);

      this.originalTestSubscription.lastSeason = newLastSeason;
      expect(this.updateFields(this.testSubscription, {lastSeason: newLastSeason})._doc).to.eql(this.originalTestSubscription._doc);

      this.originalTestSubscription.lastEpisode = newLastEpisode;
      expect(this.updateFields(this.testSubscription, {lastEpisode: newLastEpisode})._doc).to.eql(this.originalTestSubscription._doc);
    });

    it('should update multiple fields but ignore invalid ones', function () {
      var newName = 'new name',
        newSearchParameters = 'new parameters',
        newLastSeason = 56,
        newLastEpisode = 78;

      this.originalTestSubscription.name = newName;
      this.originalTestSubscription.searchParameters = newSearchParameters;
      this.originalTestSubscription.lastSeason = newLastSeason;
      this.originalTestSubscription.lastEpisode = newLastEpisode;
      expect(this.updateFields(this.testSubscription,
        {
          name: newName,
          searchParameters: newSearchParameters,
          lastSeason: newLastSeason,
          lastEpisode: newLastEpisode,
          foo: 'asdf',
          bar: 1234
        }
      )._doc).to.eql(this.originalTestSubscription._doc);
    });
  });

  describe('createNewSubscriptionFromData', function () {
    before(function () {
      // extract tested function
      this.createNewSubscriptionFromData = RewiredHandler.__get__('createNewSubscriptionFromData');
    });

    it('should return null if the subscription data is invalid', function () {
      expect(this.createNewSubscriptionFromData()).to.be.null;
      expect(this.createNewSubscriptionFromData({})).to.be.null;
      expect(this.createNewSubscriptionFromData({searchParameters: 'abcd'})).to.be.null;
    });

    it('should return a valid subscription with fallback data where not provided', function () {
      // we need to cheat here a little
      var newSubscription = this.createNewSubscriptionFromData({name: 'foobar'})._doc;
      newSubscription._id = null;
      expect(newSubscription).to.eql(
        {
          _id: null,
          name: 'foobar',
          searchParameters: undefined,
          lastSeason: 1,
          lastEpisode: 0
        });
    });

    it('should return a valid subscription with the provided data', function () {
      // we need to cheat here a little
      var newSubscription = this.createNewSubscriptionFromData(
        {
          name: 'test name',
          searchParameters: 'test parameters',
          lastSeason: 12,
          lastEpisode: 34,
        }
      )._doc;
      newSubscription._id = null;
      expect(newSubscription).to.eql(
        {
          _id: null,
          name: 'test name',
          searchParameters: 'test parameters',
          lastSeason: 12,
          lastEpisode: 34
        });
    });
  });

  describe('requests', function () {
    beforeEach(function (done) {
      var that = this,
        log = logger.createLogger(config.logging).child({component: 'test-server'});

      /*
      // reset stubs
      this.findStub.reset();
      this.skipStub.reset();
      this.limitStub.reset();
      this.findOneStub.reset();
      */

      // prepare app
      this.app = new App(config, log);

      /*
      this.ensureConnectedStub = sinon.stub(Subscription, 'ensureConnected');
      this.ensureConnectedStub.returns(Q.fcall(() => null));
      Subscription.initialize(this.logStub);

      //this.subscriptionStub = sinon.stub();
      this.subscriptionSaveStub = sinon.stub();
      //this.subscriptionSaveStub.returnsArg(0);
      this.subscriptionSaveStub.returns(123);
      Subscription.prototype.save = this.subscriptionSaveStub;
      Subscription.save = this.subscriptionSaveStub;
      Subscription.prototype.foo = 123;

      this.psastub = sinon.stub();
      this.psastub.returns(456);
      Subscription.preSaveAction = this.psastub;
      Subscription.prototype.preSaveAction = this.psastub;

      //this.subscriptionSaveStub.returns(Q.fcall(sub => sub));
      this.subscriptionStub.prototype.save = this.subscriptionSaveStub;
      this.subscriptionStub.prototype.getReturnable = sinon.stub();
      */

      RewiredHandler.__set__('Subscription', Subscription);

      this.app.writeSubscriptionHandler = new RewiredHandler(log);

      // start server
      this.app.listen(function () {
        var url = 'http://' + this.address().address + ':' + this.address().port;
        that.server = supertest.agent(url);
        done();
      });
    });
    afterEach(function (done) {
      this.app.close(done);
    });

    describe('POST /subscriptions', function () {
      it('should return an error if no subscription name is provided', function (done) {
        this.server
          .post('/subscriptions')
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('BadRequestError');
            expect(res.body.message).to.eql('Provide the name of the tv show to subscribe to.');
            done();
          });
      });

      it('should create a new subscription without any data');

      it('should create a new subscription with initial data');
    });

    describe('POST /subscriptions/:subscriptionName', function () {
      it('should be implemented');
    });

    describe('DELETE /subscriptions/:subscriptionName', function () {
      it('should be implemented');
    });
  });
});

