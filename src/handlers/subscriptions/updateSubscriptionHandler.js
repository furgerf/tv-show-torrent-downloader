'use strict';

var restify = require('restify'),
  exec = require('child_process').exec,
  Q = require('q'),

  config = require('./../../common/config'),
  utils = require('./../../common/utils'),
  Subscription = require('./../../database/subscription');

/**
 * Determines whether the supplied `season` and `episode` refer to the same or next episode of the
 * subscription.
 *
 * @param {Subscription} sub - Subscription against which to check.
 * @param {Number} season - Season number to check.
 * @param {Number} episode - Episode number to check.
 *
 * @returns {Boolean} True if the season/episode is the same or next episode of the subscription.
 */
function isNextOrSameEpisode(sub, season, episode) {
  return (
    // same season and same or next episode
    (season === sub.lastSeason && (episode === sub.lastEpisode || episode === sub.lastEpisode + 1))
    // *OR* first episode of next season
      || (season === sub.lastSeason + 1 && (episode === 0 || episode === 1)));
}

/**
 * Starts the torrent with the supplied `torrentLink` and the configured torrent command.
 *
 * @param {String} torrentLink - Link of the torrent.
 * @param {Bunyan.Log} log - Optional. Logger instance. Uses `console.log` instead if not supplied.
 *
 * @returns {Promise} Promise which resolves if starting the torrent was successful and rejects
 *                    otherwise.
 */
function startTorrent(torrentLink, log) {
  var command = config.torrentCommand + " '" + torrentLink + "'";

  // jshint validthis: true
  log = log || this.log;

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
 * @param {String} link - Link to the torrent.
 * @param {Bunyan.Log} log - Optional. Logger instance. Doesn't generate output if not specified.
 *
 * @returns {Promise} Promise which resolves if downloading the torrent was successful and rejects
 *                    otherwise.
 */
function downloadTorrent (sub, season, episode, link, log) {
  return startTorrent(link, log)
    .then(function () {
      if (!config.productionEnvironment) {
        return;
      }

      if (!sub.updateLastEpisode(season, episode)) {
        log && log.error('Failed to update subscription %s to %s!', sub.name,
          utils.formatEpisodeNumber(sub.lastSeason, sub.lastEpisode));
        throw new Error('Error while updating subscription: Could not update database.');
      }

      return sub.save()
        .then(() => log && log.info('Successfully updated subscription %s to %s...',
          sub.name, utils.formatEpisodeNumber(sub.lastSeason, sub.lastEpisode)));
    });
}

/**
 * Handles reqests to PUT /subscriptions/:subscriptionName/update.
 * TODO: Simplify.
 */
function updateSubscriptionWithTorrent (req, res, next) {
  var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body,
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

    if (!isNextOrSameEpisode(sub, season, episode)) {
      return next(new restify.BadRequestError(
        'Episode %s of show %s cannot be downloaded when the current episode is %s',
        utils.formatEpisodeNumber(season, episode),
        sub.name,
        utils.formatEpisodeNumber(sub.lastSeason, sub.lastEpisode)
      ));
    }

    downloadTorrent(sub, season, episode, link, req.log)
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
 * Creates an instance of UpdateSubscriptionHandler.
 *
 * @constructor
 *
 * @param {Bunyan.Log} log - Logger instance.
 */
function UpdateSubscriptionHandler(log) {
  this.log = log;
  this.updateSubscriptionWithTorrent = updateSubscriptionWithTorrent;

  this.log.info('UpdateSubscriptionHandler created');
}

module.exports = UpdateSubscriptionHandler;

