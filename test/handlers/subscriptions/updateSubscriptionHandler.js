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

    restoreExec = RewiredUpdateSubscriptionHandler.__set__('exec', fakeExec),
    startTorrent = RewiredUpdateSubscriptionHandler.__get__('startTorrent');

  after(function () {
    restoreExec();
  });

  describe('startTorrent', function () {
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
    it('should be implemented');
  });

  describe('requests', function () {
    describe('PUT /subscriptions/:subscriptionName/update', function () {
      it('should be implemented');
    });
  });
});

