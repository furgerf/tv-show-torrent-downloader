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
  // Subscription = require(root + 'database/subscription'),
  RewiredUpdateSubscriptionHandler = rewire(root + 'handlers/subscriptions/updateSubscriptionHandler');

config.api.port = 0;

describe('UpdateSubscriptionHandler', function () {
  var fakeLog = testUtils.getFakeLog(),
    fakeExec = function (command, callback) {
      var actualCommand = command.slice(0, config.torrentCommand.length),
        link = command.slice(config.torrentCommand.length).split("'")[1];

      if (actualCommand !== config.torrentCommand) {
        return callback('Unexpected invocation');
      }

      if (link === failLink) {
        return callback('This is an error');
      }

      return callback(null);
    },
    failLink = 'foobar',
    successLink = 'asdf',

    restoreExec = RewiredUpdateSubscriptionHandler.__set__('exec', fakeExec);

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
      restoreStartTorrent = RewiredUpdateSubscriptionHandler.__set__('startTorrent', startTorrentStub),
      fakeSub;

    before(function () {
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
    describe('PUT /subscriptions/:subscriptionName/update', function () {
      it('should be implemented');
    });
  });
});

