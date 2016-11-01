'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  sinon = require('sinon'),
  Q = require('q'),
  rewire = require('rewire'),

  utils = require(root + 'common/utils'),
  testUtils = require('../../test-utils'),
  App = rewire(root + 'app'),
  config = require(root + 'common/config').getDebugConfig(),
  Subscription = require(root + 'database/subscription'),
  RewiredSingleSubscriptionRetriever = rewire(root + 'handlers/subscriptions/singleSubscriptionRetriever'),
  RewiredUpdateSubscriptionHandler = rewire(root + 'handlers/subscriptions/updateSubscriptionHandler');

config.api.port = 0;

describe('UpdateSubscriptionHandler', function () {
  var fakeLog = testUtils.getFakeLog(),
    fakeExec,
    failLink = 'foobar',
    successLink = 'asdf',
    downloadedTorrents,
    restoreExec;

  before(function () {
    fakeExec = function (command, callback) {
      var actualCommand = command.slice(0, config.torrentCommand.length),
        link = command.slice(config.torrentCommand.length).split("'")[1];

      if (actualCommand !== config.torrentCommand) {
        return callback('Unexpected invocation');
      }

      if (link === failLink) {
        return callback('This is an error');
      }

      downloadedTorrents.push(link);
      return callback(null);
    };
    restoreExec = RewiredUpdateSubscriptionHandler.__set__('exec', fakeExec);
  });

  beforeEach(function () {
    downloadedTorrents = [];
  });

  after(function () {
    restoreExec();
  });

  describe('startTorrent', function () {
    var startTorrent = RewiredUpdateSubscriptionHandler.__get__('startTorrent');

    it('should reject if the command failed', function (done) {
      startTorrent(config.torrentCommand, failLink, fakeLog)
        .fail(function (err) {
          expect(err).to.eql('This is an error');
          done();
        });
    });

    it('should resolve if the command executed successfully', function (done) {
      startTorrent(config.torrentCommand, successLink, fakeLog)
        .then(done);
    });
  });

  describe('downloadTorrent', function () {
    var startTorrentStub = sinon.stub(),
      restoreStartTorrent,
      fakeSub;

    before(function () {
      restoreStartTorrent = RewiredUpdateSubscriptionHandler.__set__('startTorrent', startTorrentStub),
      fakeSub = {
        updateLastEpisode: sinon.stub(),
        save: sinon.stub()
      };
    });

    beforeEach(function () {
      startTorrentStub.reset();
      fakeSub.updateLastEpisode.reset();
      fakeSub.save.reset();
    });

    after(function () {
      restoreStartTorrent();
    });

    it('should fail if the download of an invalid season/episode was started', function (done) {
      var season = 12,
        episode = 34,
        command = 'foo',
        link = 'bar';

      startTorrentStub.returns(testUtils.getResolvingPromise());
      fakeSub.updateLastEpisode.returns(false);

      RewiredUpdateSubscriptionHandler.downloadTorrent(fakeSub, season, episode, command, link, fakeLog)
      .fail(function (err) {
        expect(err.message).to.eql('Error while updating subscription: Could not update database.');

        expect(startTorrentStub.calledOnce).to.be.true;
        expect(startTorrentStub.calledWith(command, link, fakeLog)).to.be.true;

        expect(fakeSub.updateLastEpisode.calledOnce).to.be.true;
        expect(fakeSub.updateLastEpisode.calledWith(season, episode)).to.be.true;

        expect(fakeSub.save.notCalled).to.be.true;

        done();
      });
    });

    it('should succeed if the download of a valid season/episode was started', function (done) {
      var season = 12,
        episode = 34,
        command = 'foo',
        link = 'bar';

      startTorrentStub.returns(testUtils.getResolvingPromise());
      fakeSub.updateLastEpisode.returns(true);
      fakeSub.save.returns(testUtils.getResolvingPromise());

      RewiredUpdateSubscriptionHandler.downloadTorrent(fakeSub, season, episode, command, link, fakeLog)
      .then(function () {
        expect(startTorrentStub.calledOnce).to.be.true;
        expect(startTorrentStub.calledWith(command, link, fakeLog)).to.be.true;

        expect(fakeSub.updateLastEpisode.calledOnce).to.be.true;
        expect(fakeSub.updateLastEpisode.calledWith(season, episode)).to.be.true;

        expect(fakeSub.save.calledOnce).to.be.true;

        done();
      });
    });
  });

  describe('requests', function () {
    var sampleSubscriptions = testUtils.getSampleSubscriptionData().map(Subscription.createNew),
      saveStub = sinon.stub(),
      fakeSubscription,

      restoreSubscriptionRetriever,
      restoreApp,

      server,
      app,

      ensureConnectedStub,
      realSubscriptionLog;

    before(function () {
      var explicitPreSaveAction = testUtils.extractSubscriptionPreSaveAction();

      fakeSubscription = testUtils.getFakeFindSubscription(function (sub) {
        if (sub) {
          sub.getReturnable = Subscription.model.schema.methods.getReturnable;
          sub.explicitPreSaveAction = explicitPreSaveAction;
          sub.save = function () {
            return sub.explicitPreSaveAction(testUtils.getResolvingPromise())
              .then(() => sub);
          };
        }
        return sub;
      });

      saveStub.returns(Q.fcall(() => this));

      // stub the real Subscription's ensureConnected
      ensureConnectedStub = sinon.stub(Subscription.model, 'ensureConnected');
      ensureConnectedStub.returns(testUtils.getResolvingPromise());

      // replace real log
      realSubscriptionLog = Subscription.model.log;
      Subscription.model.log = testUtils.getFakeLog();
    });

    beforeEach(function (done) {
      // prepare app
      // inject fake subscription in the subscriptionRetriever
      restoreSubscriptionRetriever = RewiredSingleSubscriptionRetriever.__set__('Subscription', fakeSubscription);
      // inject modified subscriptionRetriever in the app
      restoreApp = App.__set__('subscriptionRetriever', RewiredSingleSubscriptionRetriever);
      // create app
      app = new App(config, testUtils.getFakeLog());
      // replace USH
      app.updateSubscriptionHandler = new RewiredUpdateSubscriptionHandler(config.torrentCommand, testUtils.getFakeLog());

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
      restoreApp();

      ensureConnectedStub.restore();
      Subscription.model.log = realSubscriptionLog;
    });

    describe('PUT /subscriptions/:subscriptionName/update', function () {
      it('should return an error if there is no subscription with that name', function (done) {
        server
          .put('/subscriptions/' + testUtils.nonexistentSubscriptionName + '/update')
          .field('season', 123)
          .field('episode', 456)
          .field('link', 'foobar')
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('BadRequestError');
            expect(res.body.message).to.eql('No subscription found with the given name.');

            expect(downloadedTorrents).to.eql([]);

            done();
          });
      });

      it('should return an error if the season isn\'t specified', function (done) {
        var testSubscriptionName = sampleSubscriptions[0].name;
        server
          .put('/subscriptions/' + testSubscriptionName + '/update')
          .field('episode', 123)
          .field('link', 'foobar')
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('BadRequestError');
            expect(res.body.message).to.eql('`season`, `episode`, and `link` must be specified in the request body');

            expect(downloadedTorrents).to.eql([]);

            done();
          });
      });

      it('should return an error if the season isn\'t specified', function (done) {
        var testSubscriptionName = sampleSubscriptions[0].name;
        server
          .put('/subscriptions/' + testSubscriptionName + '/update')
          .field('season', 123)
          .field('link', 456)
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('BadRequestError');
            expect(res.body.message).to.eql('`season`, `episode`, and `link` must be specified in the request body');

            expect(downloadedTorrents).to.eql([]);

            done();
          });
      });

      it('should return an error if the season isn\'t specified', function (done) {
        var testSubscriptionName = sampleSubscriptions[0].name;
        server
          .put('/subscriptions/' + testSubscriptionName + '/update')
          .field('season', 123)
          .field('episode', 456)
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('BadRequestError');
            expect(res.body.message).to.eql('`season`, `episode`, and `link` must be specified in the request body');

            expect(downloadedTorrents).to.eql([]);

            done();
          });
      });

      it('should return an error if the attempted update is not for a same or next episode', function (done) {
        var testSubscription = sampleSubscriptions[0],
          testSubscriptionName = testSubscription.name,
          testSeason = testSubscription.lastSeason,
          testEpisode = testSubscription.lastEpisode + 2;

        server
          .put('/subscriptions/' + testSubscriptionName + '/update')
          .field('season', testSeason)
          .field('episode', testEpisode)
          .field('link', 'foobar')
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('BadRequestError');
            expect(res.body.message).to.eql('Episode ' + utils.formatEpisodeNumber(testSeason, testEpisode) +
              ' of show ' + testSubscriptionName + ' cannot be downloaded when the current episode is ' +
                utils.formatEpisodeNumber(testSubscription.lastSeason, testSubscription.lastEpisode)
            );

            expect(downloadedTorrents).to.eql([]);

            done();
          });
      });

      it('should successfully download a torrent of the same episode', function (done) {
        var testSubscription = sampleSubscriptions[0],
          testSubscriptionName = testSubscription.name,
          testSeason = testSubscription.lastSeason,
          testEpisode = testSubscription.lastEpisode;

        server
          .put('/subscriptions/' + testSubscriptionName + '/update')
          .field('season', testSeason)
          .field('episode', testEpisode)
          .field('link', successLink)
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('Success');
            expect(res.body.message).to.eql('Started torrent for new episode ' + utils.formatEpisodeNumber(testSeason, testEpisode) +
              ' of show ' + testSubscriptionName);

            expect(downloadedTorrents).to.eql([successLink]);

            done();
          });
      });

      it('should successfully download a torrent of the next episode', function (done) {
        var testSubscription = sampleSubscriptions[0],
          testSubscriptionName = testSubscription.name,
          testSeason = testSubscription.lastSeason,
          testEpisode = testSubscription.lastEpisode + 1;

        server
          .put('/subscriptions/' + testSubscriptionName + '/update')
          .field('season', testSeason)
          .field('episode', testEpisode)
          .field('link', successLink)
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.error).to.exist;
            expect(res.body.code).to.eql('Success');
            expect(res.body.message).to.eql('Started torrent for new episode ' + utils.formatEpisodeNumber(testSeason, testEpisode) +
              ' of show ' + testSubscriptionName);

            expect(downloadedTorrents).to.eql([successLink]);

            done();
          });
      });
    });
  });
});

