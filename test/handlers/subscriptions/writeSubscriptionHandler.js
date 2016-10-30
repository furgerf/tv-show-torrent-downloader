'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  sinon = require('sinon'),
  Q = require('q'),
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

    beforeEach(function () {
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
      testSubscription = Subscription.createNew(subscriptionData);
      originalTestSubscription = Subscription.createNew(subscriptionData);
      originalTestSubscription._id = testSubscription._id;
    });

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
      var newSearchParameters = 'new parameters',
        newLastSeason = 56,
        newLastEpisode = 78;

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

      // don't expect a changed name
      originalTestSubscription.searchParameters = newSearchParameters;
      originalTestSubscription.lastSeason = newLastSeason;
      originalTestSubscription.lastEpisode = newLastEpisode;
      expect(testHandler.updateFields(testSubscription, {
          name: newName, // name should be ignored
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
    var sampleSubscriptions = testUtils.getSampleSubscriptionData().map(Subscription.createNew),
      createSubscriptionStub,
      saveStub = sinon.stub(),
      findSubscriptionByNameStub,
      removeSubscriptionStub = sinon.stub(),

      explicitPreSaveAction,

      now,

      server,
      app,

      ensureConnectedStub,
      realSubscriptionLog;

    before(function () {
      saveStub.returns(Q.fcall(() => this));
      explicitPreSaveAction = testUtils.extractSubscriptionPreSaveAction();

      // creating the FSBN stub is more tricky because the return value depends on the argument
      findSubscriptionByNameStub = sinon.stub(Subscription, 'findSubscriptionByName',
        name => Q.fcall(() => {
          var sub = sampleSubscriptions.find(sub => sub.name === name);
          if (sub) {
            sub.remove = removeSubscriptionStub;
            sub.getReturnable = Subscription.model.schema.methods.getReturnable;
            sub.explicitPreSaveAction = explicitPreSaveAction;
            sub.save = function () {
              return sub.explicitPreSaveAction(testUtils.getResolvingPromise())
                .then(() => sub);
            };
          }
          return sub;
        }));

      // stub the real Subscription's ensureConnected
      ensureConnectedStub = sinon.stub(Subscription.model, 'ensureConnected');
      ensureConnectedStub.returns(testUtils.getResolvingPromise());

      // replace real log
      realSubscriptionLog = Subscription.model.log;
      Subscription.model.log = testUtils.getFakeLog();

      createSubscriptionStub = sinon.stub(Subscription, 'createNew', function (data) {
        data.explicitPreSaveAction = explicitPreSaveAction;

        data.save = function () {
          return data.explicitPreSaveAction(testUtils.getResolvingPromise())
          .then(() => data);
        };

        data.getReturnable = Subscription.model.schema.methods.getReturnable;

        return data;
      });
      RewiredWriteSubscriptionHandler.__set__('Subscription', Subscription);
    });

    beforeEach(function (done) {
      findSubscriptionByNameStub.reset();

      app = new App(config, testUtils.getFakeLog());

      now = new Date();
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
      removeSubscriptionStub.reset();
    });

    after(function () {
      findSubscriptionByNameStub.restore();
      createSubscriptionStub.restore();
      ensureConnectedStub.restore();
      Subscription.model.log = realSubscriptionLog;
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

      it('should create a new subscription without any data', function (done) {
        var newSubscriptionName = 'foo';
        server
          .post('/subscriptions')
          .field('name', newSubscriptionName)
          .expect('Content-type', 'application/json')
          .expect(201)
          .end(function (err, res) {
            var afterRequest = new Date(),
              parsedCreationTime,
              parsedLastModifiedTime;

            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('Success');
            expect(res.body.message).to.eql('New subscription created');
            expect(res.body.data.name).to.eql(newSubscriptionName);
            expect(res.body.data.searchParameters).to.eql('');
            expect(res.body.data.lastSeason).to.eql(1);
            expect(res.body.data.lastEpisode).to.eql(0);

            parsedCreationTime = Date.parse(res.body.data.creationTime);
            expect(parsedCreationTime).to.not.be.NaN;
            expect(afterRequest.getTime() - parsedCreationTime).to.be.below(testUtils.timeEpsilon);

            parsedLastModifiedTime = Date.parse(res.body.data.lastModifiedTime);
            expect(parsedLastModifiedTime).to.not.be.NaN;
            expect(afterRequest.getTime() - parsedLastModifiedTime).to.be.below(testUtils.timeEpsilon);

            expect(res.body.data.lastDownloadTime).to.not.exist;
            expect(res.body.data.lastUpdateCheckTime).to.not.exist;

            done();
          });
      });

      it('should create a new subscription with initial data and filter out invalid data', function (done) {
        var newSubscriptionData = testUtils.getSampleSubscriptionData()[0],
          dummyField = 'dummy';

        server
          .post('/subscriptions')
          .field('name', newSubscriptionData.name)
          .field('searchParameters', newSubscriptionData.searchParameters)
          .field('lastSeason', newSubscriptionData.lastSeason)
          .field('lastEpisode', newSubscriptionData.lastEpisode)
          .field(dummyField, 123)
          .expect('Content-type', 'application/json')
          .expect(201)
          .end(function (err, res) {
            var afterRequest = new Date(),
              parsedCreationTime,
              parsedLastModifiedTime;

            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('Success');
            expect(res.body.message).to.eql('New subscription created');
            expect(res.body.data.name).to.eql(newSubscriptionData.name);
            expect(res.body.data.searchParameters).to.eql(newSubscriptionData.searchParameters);
            expect(parseInt(res.body.data.lastSeason, 10)).to.eql(newSubscriptionData.lastSeason);
            expect(parseInt(res.body.data.lastEpisode, 10)).to.eql(newSubscriptionData.lastEpisode);

            parsedCreationTime = Date.parse(res.body.data.creationTime);
            expect(parsedCreationTime).to.not.be.NaN;
            expect(afterRequest.getTime() - parsedCreationTime).to.be.below(testUtils.timeEpsilon);

            parsedLastModifiedTime = Date.parse(res.body.data.lastModifiedTime);
            expect(parsedLastModifiedTime).to.not.be.NaN;
            expect(afterRequest.getTime() - parsedLastModifiedTime).to.be.below(testUtils.timeEpsilon);

            expect(res.body.data.lastDownloadTime).to.not.exist;
            expect(res.body.data.lastUpdateCheckTime).to.not.exist;

            expect(res.body.data[dummyField]).to.not.exist;

            done();
          });
      });
    });

    describe('POST /subscriptions/:subscriptionName', function () {
      it('should return an error if the body specifies a different name than the url', function (done) {
        var oldName = 'foo',
          newName = 'bar';

        server
          .post('/subscriptions/' + oldName)
          .field('name', newName)
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('BadRequestError');
            expect(res.body.message).to.eql('Cannot change the name of a subscription');
            done();
          });
      });

      it('should not do anything if no valid fields are specified for updating', function (done) {
        var subscriptionData = testUtils.getSampleSubscriptionData()[0],
          subscriptionName = subscriptionData.name,
          dummyField = 'dummy';

        server
          .post('/subscriptions/' + subscriptionName)
          .field(dummyField, 123)
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            var afterRequest = new Date(),
              parsedCreationTime,
              parsedLastModifiedTime,
              parsedLastDownloadTime,
              parsedLastUpdateCheckTime;

            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('Success');
            expect(res.body.message).to.eql('Subscription updated');
            expect(res.body.data.name).to.eql(subscriptionName);
            expect(res.body.data.searchParameters).to.eql(subscriptionData.searchParameters);
            expect(parseInt(res.body.data.lastSeason, 10)).to.eql(subscriptionData.lastSeason);
            expect(parseInt(res.body.data.lastEpisode, 10)).to.eql(subscriptionData.lastEpisode);

            // creation time shouldn't have changed
            parsedCreationTime = Date.parse(res.body.data.creationTime);
            expect(parsedCreationTime).to.not.be.NaN;
            expect(parsedCreationTime).to.eql(subscriptionData.creationTime.getTime());

            // last modified time should be about now
            parsedLastModifiedTime = Date.parse(res.body.data.lastModifiedTime);
            expect(parsedLastModifiedTime).to.not.be.NaN;
            expect(afterRequest.getTime() - parsedLastModifiedTime).to.be.below(testUtils.timeEpsilon);

            parsedLastDownloadTime = Date.parse(res.body.data.creationTime);
            expect(parsedLastDownloadTime).to.not.be.NaN;
            expect(parsedLastDownloadTime).to.eql(subscriptionData.creationTime.getTime());

            parsedLastUpdateCheckTime = Date.parse(res.body.data.creationTime);
            expect(parsedLastUpdateCheckTime).to.not.be.NaN;
            expect(parsedLastUpdateCheckTime).to.eql(subscriptionData.creationTime.getTime());

            expect(res.body.data[dummyField]).to.not.exist;

            done();
          });
      });


      it('should create a new subscription with initial data and filter out invalid data', function (done) {
        var newSubscriptionData = testUtils.getSampleSubscriptionData()[0],
          dummyField = 'dummy';

        server
          .post('/subscriptions/' + testUtils.nonexistentSubscriptionName)
          .field('searchParameters', newSubscriptionData.searchParameters)
          .field('lastSeason', newSubscriptionData.lastSeason)
          .field('lastEpisode', newSubscriptionData.lastEpisode)
          .field(dummyField, 123)
          .expect('Content-type', 'application/json')
          .expect(201)
          .end(function (err, res) {
            var afterRequest = new Date(),
              parsedCreationTime,
              parsedLastModifiedTime;

            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('Success');
            expect(res.body.message).to.eql('New subscription created');
            expect(res.body.data.name).to.eql(testUtils.nonexistentSubscriptionName);
            expect(res.body.data.searchParameters).to.eql(newSubscriptionData.searchParameters);
            expect(parseInt(res.body.data.lastSeason, 10)).to.eql(newSubscriptionData.lastSeason);
            expect(parseInt(res.body.data.lastEpisode, 10)).to.eql(newSubscriptionData.lastEpisode);

            parsedCreationTime = Date.parse(res.body.data.creationTime);
            expect(parsedCreationTime).to.not.be.NaN;
            expect(afterRequest.getTime() - parsedCreationTime).to.be.below(testUtils.timeEpsilon);

            parsedLastModifiedTime = Date.parse(res.body.data.lastModifiedTime);
            expect(parsedLastModifiedTime).to.not.be.NaN;
            expect(afterRequest.getTime() - parsedLastModifiedTime).to.be.below(testUtils.timeEpsilon);

            expect(res.body.data.lastDownloadTime).to.not.exist;
            expect(res.body.data.lastUpdateCheckTime).to.not.exist;

            expect(res.body.data[dummyField]).to.not.exist;

            done();
          });
      });

      it('should update valid fields and ignore invalid fields', function (done) {
        var existingSubscriptionData = testUtils.getSampleSubscriptionData()[0],
          existingSubscriptionName = existingSubscriptionData.name,
          updatingSubscriptionData = testUtils.getSampleSubscriptionData()[2],
          dummyField = 'dummy';

        server
          .post('/subscriptions/' + existingSubscriptionName)
          .field('name', existingSubscriptionName)
          .field('searchParameters', updatingSubscriptionData.searchParameters)
          .field('lastSeason', updatingSubscriptionData.lastSeason)
          .field('lastEpisode', updatingSubscriptionData.lastEpisode)
          .field(dummyField, 123)
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            var afterRequest = new Date(),
              parsedCreationTime,
              parsedLastModifiedTime,
              parsedLastDownloadTime,
              parsedLastUpdateCheckTime;

            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('Success');
            expect(res.body.message).to.eql('Subscription updated');
            expect(res.body.data.name).to.eql(existingSubscriptionName); // the name isn't changed
            expect(res.body.data.searchParameters).to.eql(updatingSubscriptionData.searchParameters);
            expect(parseInt(res.body.data.lastSeason, 10)).to.eql(updatingSubscriptionData.lastSeason);
            expect(parseInt(res.body.data.lastEpisode, 10)).to.eql(updatingSubscriptionData.lastEpisode);

            // creation time shouldn't have changed
            parsedCreationTime = Date.parse(res.body.data.creationTime);
            expect(parsedCreationTime).to.not.be.NaN;
            expect(parsedCreationTime).to.eql(existingSubscriptionData.creationTime.getTime());

            // last modified time should be about now
            parsedLastModifiedTime = Date.parse(res.body.data.lastModifiedTime);
            expect(parsedLastModifiedTime).to.not.be.NaN;
            expect(afterRequest.getTime() - parsedLastModifiedTime).to.be.below(testUtils.timeEpsilon);

            parsedLastDownloadTime = Date.parse(res.body.data.lastDownloadTime);
            expect(parsedLastDownloadTime).to.not.be.NaN;
            expect(parsedLastDownloadTime).to.eql(existingSubscriptionData.lastDownloadTime.getTime());
            parsedLastUpdateCheckTime = Date.parse(res.body.data.lastUpdateCheckTime);
            expect(parsedLastUpdateCheckTime).to.not.be.NaN;
            expect(parsedLastUpdateCheckTime).to.eql(existingSubscriptionData.lastUpdateCheckTime.getTime());
            expect(res.body.data[dummyField]).to.not.exist;

            done();
          });
      });
    });

    describe('DELETE /subscriptions/:subscriptionName', function () {
      it('should return an error if an unknown subscription name is provided', function (done) {
        server
          .delete('/subscriptions/' + testUtils.nonexistentSubscriptionName)
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('BadRequestError');
            expect(res.body.message).to.eql("No subscription named '" + testUtils.nonexistentSubscriptionName + "'.");

            expect(removeSubscriptionStub.notCalled).to.be.true;

            done();
          });
      });

      it('should successfully remove a subscription', function (done) {
        server
          .delete('/subscriptions/' + sampleSubscriptions[0].name)
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('Success');
            expect(res.body.message).to.eql("Removed subscription with name '" + sampleSubscriptions[0].name + "'.");

            expect(removeSubscriptionStub.calledOnce).to.be.true;

            done();
          });
      });
    });
  });
});

