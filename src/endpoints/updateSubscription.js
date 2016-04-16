'use strict';

var restify = require('restify'),
  exec = require('child_process').exec,
  url = require('url'),

  config = require('./../config'),
  utils = require('./../utils'),

  torrentSites = require('./../torrent-sites/'),

  Subscription = require('./../database/subscription').Subscription;

function startTorrent(torrentLink, log) {
  var command = config.torrentCommand + ' \'' + torrentLink + '\'';

  log && log.warn('Starting torrent: %s (command: %s)', torrentLink, command);

  exec(command, function (err, stdout, stderr) {
    if (err) {
      if (log) {
        log.error(err);
      } else {
        console.log(err);
      }

      return err;
    }

    if (stderr) {
      if (log) {
        log.warn('Torrent command stderr: %s', stderr);
      } else {
        console.log('Torrent command stderr: %s', stderr);
      }
    }

    if (stdout) {
      if (log) {
        log.info('Torrent command stdout: %s', stdout);
      } else {
        console.log('Torrent command stdout: %s', stdout);
      }
    }
  });
}

exports.updateSubscriptionWithTorrent = function (req, res, next) {
  return next(new restify.InternalServerError('Not implemented'));
};

