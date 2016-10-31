'use strict';

var restify = require('restify'),
  exec = require('child_process').exec,
  Q = require('q'),

  utils = require('./../../common/utils'),
  Subscription = require('./../../database/subscription'),

  UpdateSubscriptionHandler;

/**
 * Handles reqests to PUT /subscriptions/:subscriptionName/update.
 * TODO: Simplify.
 */
function updateSubscriptionWithTorrent (req, res, next) {
  var body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}),
    subscriptionName = decodeURIComponent(req.params[0]),
    season = parseInt(body.season, 10),
    episode = parseInt(body.episode, 10),
    link = body.link;

  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    if (subscriptions.length === 0) {
      req.log.warn('No subscription with name "%s" found', subscriptionName);
      return next(
        new restify.BadRequestError("No subscription with name '" + subscriptionName + "'"));
    }

    var sub = subscriptions[0];

    req.log.info('Requesting to download %s, %s',
      subscriptionName, utils.formatEpisodeNumber(season, episode));

    if (!sub.isSameOrNextEpisode(season, episode)) {
      return next(new restify.BadRequestError(
        'Episode %s of show %s cannot be downloaded when the current episode is %s',
        utils.formatEpisodeNumber(season, episode),
        sub.name,
        utils.formatEpisodeNumber(sub.lastSeason, sub.lastEpisode)
      ));
    }

    UpdateSubscriptionHandler.downloadTorrent( // TODO: Check that `this` is defined
        sub, season, episode, this.torrentCommand, link, req.log)
      .then(() => sub.updateLastDownloadTime())
      .then(function () {
        utils.sendOkResponse('Started torrent for new episode '
          + utils.formatEpisodeNumber(season, episode) + ' of ' + sub.name,
          null, res, next, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      })
      .catch(function (error) {
        return next(
          new restify.InternalServerError('Error while trying to start torrent: %s', error)
        );
      });
  });
}


/**
 * Starts the torrent with the supplied `torrentLink` and the configured torrent command.
 *
 * @param {String} torrentCommand - Command to start the torrent download.
 * @param {String} torrentLink - Link of the torrent.
 * @param {Bunyan.Log} log - Optional. Logger instance. Uses `console.log` instead if not supplied.
 *
 * @returns {Promise} Promise which resolves if starting the torrent was successful and rejects
 *                    otherwise.
 */
function startTorrent(torrentCommand, torrentLink, log) {
  var command = torrentCommand + " '" + torrentLink + "'";

  log = log;

  log.warn('Starting torrent: %s (command: %s)', torrentLink, command);

  return Q.Promise(function (resolve, reject) {
    exec(command, function (err, stdout, stderr) {
      if (err) {
        log.error(err);
        return reject(err);
      }

      if (stderr) {
        log.warn('Torrent command stderr: %s', stderr);
      }
      if (stdout) {
        log.info('Torrent command stdout: %s', stdout);
      }

      resolve();
    });
  });
}


/**
 * "Downloads" a torrent by starting the torrent download and updating the current season/episode
 * of the subscription.
 *
 * @param {Subscription} sub - Subscription to which the torrent belongs.
 * @param {Number} season - Season number of the torrent.
 * @param {Number} episode - Episode number of the torrent.
 * @param {String} command - Command to start the torrent download.
 * @param {String} link - Link to the torrent.
 * @param {Bunyan.Log} log - Logger instance. Doesn't generate output if not specified.
 *
 * @returns {Promise} Promise which resolves if downloading the torrent was successful and rejects
 *                    otherwise.
 */
UpdateSubscriptionHandler.downloadTorrent = function (sub, season, episode, command, link, log) {
  return startTorrent(command, link, log)
    .then(function () {
      if (!sub.updateLastEpisode(season, episode)) {
        log.error('Failed to update subscription %s to %s!', sub.name,
          utils.formatEpisodeNumber(sub.lastSeason, sub.lastEpisode));
        throw new Error('Error while updating subscription: Could not update database.');
      }

      return sub.save()
        .then(() => log.info('Successfully updated subscription %s to %s...',
          sub.name, utils.formatEpisodeNumber(sub.lastSeason, sub.lastEpisode)));
    });
};


/**
 * Creates an instance of UpdateSubscriptionHandler.
 *
 * @constructor
 *
 * @param {String} torrentCommand - Command that should be used to start a torrent.
 * @param {Bunyan.Log} log - Logger instance.
 */
function UpdateSubscriptionHandler(torrentCommand, log) {
  this.torrentCommand = torrentCommand;
  this.log = log;

  this.updateSubscriptionWithTorrent = updateSubscriptionWithTorrent;

  this.log.info('UpdateSubscriptionHandler created');
}

module.exports = UpdateSubscriptionHandler;

