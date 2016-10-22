'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  rewire = require('rewire'),

  testUtils = require('../../test-utils'),
  App = require(root + 'app'),
  config = require(root + 'common/config').getDebugConfig(),
  Subscription = require(root + 'database/subscription'),
  RewiredWriteSubscriptionHandler = rewire(root + 'handlers/subscriptions/writeSubscriptionHandler');

config.api.port = 0;

describe('WriteSubscriptionHandler', function () {
  describe('updateFields', function () {
    var subscriptionData,
      testSubscription,
      originalTestSubscription,
      now = new Date(),
      fakeLog = testUtils.getFakeLog(),
      testHandler = new RewiredWriteSubscriptionHandler(testUtils.getFakeLog());

    subscriptionData = {
      name: 'test name',
      searchParameters: 'test parameters',
      lastSeason: 12,
      lastEpisode: 34,
      creationTime: now,
      lastModifiedTime: now,
      lastDownloadTime: now,
      lastUpdateCheckTime: now
    };

    // create two subscriptions with the same data - including the _id!
    testSubscription = new Subscription(subscriptionData);
    originalTestSubscription = new Subscription(subscriptionData);
    originalTestSubscription._id = testSubscription._id;

    it('should return the original subscription if the data is not valid', function () {
      expect(testHandler.updateFields(testSubscription, undefined, fakeLog)._doc).to.eql(originalTestSubscription._doc);
      expect(testHandler.updateFields(testSubscription, 1234, fakeLog)._doc).to.eql(originalTestSubscription._doc);
      expect(testHandler.updateFields(testSubscription, 'abcd', fakeLog)._doc).to.eql(originalTestSubscription._doc);

      expect(testHandler.updateFields(undefined, undefined, fakeLog)).to.eql(undefined);
      expect(testHandler.updateFields(null, {}, fakeLog)).to.eql(null);
      expect(testHandler.updateFields(1234, {}, fakeLog)).to.eql(1234);
      expect(testHandler.updateFields('abcd', {}, fakeLog)).to.eql('abcd');
    });

    it('should ignore extra fields', function () {
      expect(testHandler.updateFields(testSubscription, {foo: 'bar'}, fakeLog)._doc).to.eql(originalTestSubscription._doc);
      expect(testHandler.updateFields(testSubscription, {bar: 1234}, fakeLog)._doc).to.eql(originalTestSubscription._doc);
    });

    it('should update valid fields', function () {
      var newName = 'new name',
        newSearchParameters = 'new parameters',
        newLastSeason = 56,
        newLastEpisode = 78;

      originalTestSubscription.name = newName;
      expect(testHandler.updateFields(testSubscription, {name: newName}, fakeLog)._doc).to.eql(originalTestSubscription._doc);

      originalTestSubscription.searchParameters = newSearchParameters;
      expect(testHandler.updateFields(testSubscription, {searchParameters: newSearchParameters}, fakeLog)._doc).to.eql(originalTestSubscription._doc);

      originalTestSubscription.lastSeason = newLastSeason;
      expect(testHandler.updateFields(testSubscription, {lastSeason: newLastSeason}, fakeLog)._doc).to.eql(originalTestSubscription._doc);

      originalTestSubscription.lastEpisode = newLastEpisode;
      expect(testHandler.updateFields(testSubscription, {lastEpisode: newLastEpisode}, fakeLog)._doc).to.eql(originalTestSubscription._doc);
    });

    it('should update multiple fields but ignore invalid ones', function () {
      var newName = 'new name',
        newSearchParameters = 'new parameters',
        newLastSeason = 56,
        newLastEpisode = 78;

      originalTestSubscription.name = newName;
      originalTestSubscription.searchParameters = newSearchParameters;
      originalTestSubscription.lastSeason = newLastSeason;
      originalTestSubscription.lastEpisode = newLastEpisode;
      expect(testHandler.updateFields(testSubscription, {
          name: newName,
          searchParameters: newSearchParameters,
          lastSeason: newLastSeason,
          lastEpisode: newLastEpisode,
          foo: 'asdf',
          bar: 1234
        }, fakeLog)._doc).to.eql(originalTestSubscription._doc);
    });
  });

  describe('createNewSubscriptionFromData', function () {
      var createNewSubscriptionFromData = RewiredWriteSubscriptionHandler.__get__('createNewSubscriptionFromData');

    it('should return null if the subscription data is invalid', function () {
      expect(createNewSubscriptionFromData()).to.be.null;
      expect(createNewSubscriptionFromData({})).to.be.null;
      expect(createNewSubscriptionFromData({searchParameters: 'abcd'})).to.be.null;
    });

    it('should return a valid subscription with fallback data where not provided', function () {
      // we need to cheat here a little
      var newSubscription = createNewSubscriptionFromData({name: 'foobar'})._doc;
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
      var newSubscription = createNewSubscriptionFromData(
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
    var server,
      app;

    beforeEach(function (done) {
      app = new App(config, testUtils.getFakeLog());

      RewiredWriteSubscriptionHandler.__set__('Subscription', Subscription);

      app.writeSubscriptionHandler = new RewiredWriteSubscriptionHandler(testUtils.getFakeLog());

      // start server
      app.listen(function () {
        var url = 'http://' + this.address().address + ':' + this.address().port;
        server = supertest.agent(url);
        done();
      });
    });
    afterEach(function (done) {
      app.close(done);
    });

    describe('POST /subscriptions', function () {
      it('should return an error if no subscription name is provided', function (done) {
        server
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

