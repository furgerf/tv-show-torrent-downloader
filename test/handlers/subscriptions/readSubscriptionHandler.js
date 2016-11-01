'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  rewire = require('rewire'),

  App = rewire(root + 'app'),
  config = require(root + 'common/config').getDebugConfig(),
  testUtils = require('../../test-utils'),
  Subscription = require(root + 'database/subscription'),
  RewiredSingleSubscriptionRetriever = rewire(root + 'handlers/subscriptions/singleSubscriptionRetriever'),
  RewiredReadSubscriptionHandler = rewire(root + 'handlers/subscriptions/readSubscriptionHandler');

config.api.port = 0;

describe('ReadSubscriptionHandler', function () {
  describe('requests', function () {
    // prepare sample data
    var sampleSubscriptions = testUtils.getSampleSubscriptionData().map(Subscription.createNew),
      findAllSubscriptionsStub,
      findSubscriptionByNameStub,
      fakeSubscription,
      restoreSubscriptionRetriever,
      restoreHandler,
      restoreApp,

      server,
      app;

    before(function () {
      fakeSubscription = testUtils.getFakeFindSubscription();
      findAllSubscriptionsStub = fakeSubscription.findAllSubscriptions;
      findSubscriptionByNameStub = fakeSubscription.findSubscriptionByName;
    });

    beforeEach(function (done) {
      // reset stubs
      findAllSubscriptionsStub.reset();
      findSubscriptionByNameStub.reset();

      // prepare app
      // inject fake subscription in the subscriptionRetriever
      restoreSubscriptionRetriever = RewiredSingleSubscriptionRetriever.__set__('Subscription', fakeSubscription);
      // inject fake subscription in the RSH
      restoreHandler = RewiredReadSubscriptionHandler.__set__('Subscription', fakeSubscription);
      // inject modified subscriptionRetriever in the app
      restoreApp = App.__set__('subscriptionRetriever', RewiredSingleSubscriptionRetriever);
      // create app
      app = new App(config, testUtils.getFakeLog());
      // replace RSH
      app.readSubscriptionHandler = new RewiredReadSubscriptionHandler(testUtils.getFakeLog());

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

    after(function () {
      restoreSubscriptionRetriever();
      restoreHandler();
      restoreApp();
    });

    describe('GET /subscriptions', function () {
      it('should correctly return all sample subscriptions', function (done) {
        server
          .get('/subscriptions')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql([
              {
                name : 'foo',
                searchParameters : '720p',
                lastSeason : 12,
                lastEpisode : 23,
                creationTime : '2016-05-22T08:11:27.922Z',
                lastModifiedTime : '2016-09-18T14:00:15.404Z',
                lastDownloadTime : '2016-05-22T00:00:00.000Z',
                lastUpdateCheckTime : '2016-09-18T14:00:15.398Z'
              },
              {
                name : 'bar',
                searchParameters : null,
                lastSeason : 3,
                lastEpisode : 3,
                creationTime : '2016-05-22T08:03:00.633Z',
                lastModifiedTime : '2016-09-26T14:00:06.135Z',
                lastUpdateCheckTime : '2016-09-26T14:00:06.131Z',
                lastDownloadTime : '2012-12-21T00:00:00.000Z'
              },
              {
                name : 'foobar',
                searchParameters : '1080p',
                lastSeason : 2,
                lastEpisode : 10,
                creationTime : '2015-12-20T18:12:16.100Z',
                lastModifiedTime : '2016-09-26T14:00:06.296Z',
                lastUpdateCheckTime : '2016-09-26T14:00:06.290Z',
                lastDownloadTime : '2015-12-14T00:00:00.000Z'
              },
              {
                name : 'test',
                searchParameters : 'test',
                lastSeason : 11,
                lastEpisode : 22,
                creationTime : '2015-12-20T18:12:34.667Z',
                lastModifiedTime : '2015-12-20T18:12:34.667Z',
                lastUpdateCheckTime : '2015-12-20T18:12:34.667Z',
                lastDownloadTime : '2015-12-20T18:12:34.667Z'
              }
            ]);

            expect(findAllSubscriptionsStub.calledOnce).to.be.true;
            expect(findSubscriptionByNameStub.notCalled).to.be.true;

            done();
          });
      });
    });

    describe('GET /subscriptions/:subscriptionName', function () {
      it('should correctly handle unknown subscriptions', function (done) {
        server
          .get('/subscriptions/' + testUtils.nonexistentSubscriptionName)
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('BadRequestError');
            expect(res.body.message).to.equal("No subscription found with the given name.");
            expect(res.body.data).to.not.exist;

            expect(findAllSubscriptionsStub.notCalled).to.be.true;
            expect(findSubscriptionByNameStub.calledOnce).to.be.true;
            expect(findSubscriptionByNameStub.calledWith(testUtils.nonexistentSubscriptionName)).to.be.true;

            done();
          });
      });

      it('should correctly return sample subscriptions', function (done) {
        server
          .get('/subscriptions/' + sampleSubscriptions[0].name)
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql(
              {
                name : 'foo',
                searchParameters : '720p',
                lastSeason : 12,
                lastEpisode : 23,
                creationTime : '2016-05-22T08:11:27.922Z',
                lastModifiedTime : '2016-09-18T14:00:15.404Z',
                lastDownloadTime : '2016-05-22T00:00:00.000Z',
                lastUpdateCheckTime : '2016-09-18T14:00:15.398Z'
              }
            );

            expect(findAllSubscriptionsStub.notCalled).to.be.true;
            expect(findSubscriptionByNameStub.calledOnce).to.be.true;
            expect(findSubscriptionByNameStub.calledWith(sampleSubscriptions[0].name)).to.be.true;

            done();
          });
      });

      it('should correctly return sample subscriptions', function (done) {
        server
          .get('/subscriptions/' + sampleSubscriptions[1].name)
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql(
              {
                name : 'bar',
                searchParameters : null,
                lastSeason : 3,
                lastEpisode : 3,
                creationTime : '2016-05-22T08:03:00.633Z',
                lastModifiedTime : '2016-09-26T14:00:06.135Z',
                lastUpdateCheckTime : '2016-09-26T14:00:06.131Z',
                lastDownloadTime : '2012-12-21T00:00:00.000Z'
              }
            );

            expect(findAllSubscriptionsStub.notCalled).to.be.true;
            expect(findSubscriptionByNameStub.calledOnce).to.be.true;
            expect(findSubscriptionByNameStub.calledWith(sampleSubscriptions[1].name)).to.be.true;

            done();
          });
      });
    });
  });
});

