'use strict';

var restify = require('restify'),
  exec = require('child_process').exec,
  Q = require('q'),

  utils = require('./../../common/utils'),

  UpdateSubscriptionHandler;


/**
 * Tries to parse a request body and extract the parameters that are required for updating a
 * subscription.
 *
 * @param {Object} requestBody - Body of the request to parse.
 *
 * @returns {Object} Parsed reqeust body with properties `season`, `episode`, and `link`.
 */
function parseRequestBody(requestBody) {
  var body = (typeof requestBody === 'string') ? JSON.parse(requestBody) : (requestBody || {}),
    season = parseInt(body.season, 10),
    episode = parseInt(body.episode, 10),
    link = body.link;

  return {
    season: season,
    episode: episode,
    link: link
  };
}

/**
 * Determines whether a parsed request body contains the necessary information for an update.
 *
 * @param {Object} body - Parsed request body.
 *
 * @returns {Boolean} True if the body contains the necessary information.
 */
function hasValidRequestBodyParameters(body) {
  // use double negation for link to check if it is truthy
  return !isNaN(body.season) && !isNaN(body.episode) && !!body.link;
}

/**
 * Handles reqests to PUT /subscriptions/:subscriptionName/update.
 */
function updateSubscriptionWithTorrent (req, res, next) {
  var body = parseRequestBody(req.body);

  if (!hasValidRequestBodyParameters(body)) {
    return next(new restify.BadRequestError(
      '`season`, `episode`, and `link` must be specified in the request body'));
  }

  if (!req.subscription) {
    return next(new restify.BadRequestError('No subscription found with the given name.'));
  }

  req.log.info('Requesting to download %s, %s',
    req.subscription.name, utils.formatEpisodeNumber(body.season, body.episode));

  if (!req.subscription.isSameOrNextEpisode(body.season, body.episode)) {
    return next(new restify.BadRequestError(
      'Episode %s of show %s cannot be downloaded when the current episode is %s',
      utils.formatEpisodeNumber(body.season, body.episode), req.subscription.name,
      utils.formatEpisodeNumber(req.subscription.lastSeason, req.subscription.lastEpisode)
    ));
  }

  // jshint validthis: true
  UpdateSubscriptionHandler.downloadTorrent(
    req.subscription, body.season, body.episode, this.torrentCommand, body.link, req.log)
  .then(subscription => subscription.updateLastDownloadTime())
  .then(function () {
    utils.sendOkResponse('Started torrent for new episode '
      + utils.formatEpisodeNumber(body.season, body.episode) + ' of show ' + req.subscription.name,
      null, res, next, 'http://' + req.headers.host + req.url);
  });
}


/**
 * Starts the torrent with the supplied `torrentLink` and the configured torrent command.
 *
 * @param {String} torrentCommand - Command to start the torrent download.
 * @param {String} torrentLink - Link of the torrent.
 * @param {Bunyan.Log} log - Logger instance.
 *
 * @returns {Promise} Promise which resolves if starting the torrent was successful and rejects
 *                    otherwise.
 */
function startTorrent(torrentCommand, torrentLink, log) {
  var command = torrentCommand + " '" + torrentLink + "'";

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
 * @returns {Promise} Promise which resolves to the subscription if downloading the torrent was
 *                    successful and rejects otherwise.
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
        .then(function () {
          log.info('Successfully updated subscription %s to %s...',
            sub.name, utils.formatEpisodeNumber(sub.lastSeason, sub.lastEpisode));
          return sub;
        });
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

