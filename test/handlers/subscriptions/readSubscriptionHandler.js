'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  sinon = require('sinon'),
  supertest = require('supertest'),
  rewire = require('rewire'),

  App = require(root + 'app').App,
  config = require(root + 'common/config').getDebugConfig(),
  testUtils = require('../../test-utils'),
  Subscription = require(root + 'database/subscription'),
  RewiredReadSubscriptionHandler = rewire(root + 'handlers/subscriptions/readSubscriptionHandler');

config.api.port = 0;

describe('ReadSubscriptionHandler', function () {
  describe('requests', function () {
    // prepare sample data
    var sampleSubscriptions = testUtils.getSampleSubscriptionData().map(sub => new Subscription(sub)),
      fakeSubscription = testUtils.getFakeStaticSubscription(Subscription, sampleSubscriptions);

    fakeSubscription.Subscription.initialize(testUtils.getFakeLog());

    beforeEach(function (done) {
      var that = this;

      // reset stubs
      fakeSubscription.findStub.reset();
      fakeSubscription.skipStub.reset();
      fakeSubscription.limitStub.reset();
      fakeSubscription.findOneStub.reset();

      // prepare app
      this.app = new App(config, testUtils.getFakeLog());

      RewiredReadSubscriptionHandler.__set__('Subscription', fakeSubscription.Subscription);
      this.app.readSubscriptionHandler = new RewiredReadSubscriptionHandler(testUtils.getFakeLog());

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

    describe('GET /subscriptions', function () {
      it('should correctly return all sample subscriptions', function (done) {
        this.server
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
              }
            ]);
            done();
          });
      });
    });

    describe('GET /subscriptions/:subscriptionName', function () {
      it('should correctly return sample subscriptions', function (done) {
        this.server
          .get('/subscriptions/foo')
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
            done();
          });
      });

      it('should correctly return sample subscriptions', function (done) {
        this.server
          .get('/subscriptions/bar')
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
            done();
          });
      });

      it('should correctly return sample subscriptions', function (done) {
        this.server
          .get('/subscriptions/foobar')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql(
              {
                name : 'foobar',
                searchParameters : '1080p',
                lastSeason : 2,
                lastEpisode : 10,
                creationTime : '2015-12-20T18:12:16.100Z',
                lastModifiedTime : '2016-09-26T14:00:06.296Z',
                lastUpdateCheckTime : '2016-09-26T14:00:06.290Z',
                lastDownloadTime : '2015-12-14T00:00:00.000Z'
              }
            );
            done();
          });
      });

      it('should correctly handle unknown subscriptions', function (done) {
        this.server
          .get('/subscriptions/asdf')
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('BadRequestError');
            expect(res.body.message).to.equal('No subscription with name \'asdf\'.');
            expect(res.body.data).to.not.exist;
            done();
          });
      });
    });
  });
});

