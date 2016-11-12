'use strict';

var restify = require('restify'),
  Q = require('q'),

  utils = require('../../common/utils'),
  UpdateSubscription = require('./updateSubscriptionHandler'),
  Subscription = require('../../database/subscription');


/**
 * Parses the provided `torrentSort` and returns a valid torrent sorting method.
 *
 * @param {String} torrentSort - The provided torrent sort string.
 *
 * @returns {String} Valid torrent sorting method.
 */
function getTorrentSort(torrentSort) {
  const DEFAULT_SORT = 'largest',
        validSortsLowercase = [ 'largest', 'smallest', 'newest', 'oldest', 'mostseeded' ];

  var sort = (torrentSort || DEFAULT_SORT).toString().toLowerCase();

  return validSortsLowercase.indexOf(sort) > -1 ? sort : DEFAULT_SORT;
}

/**
 * Parses the data that was sent with the request. First priority are the request params from
 * the query string, second priority is the request body. The information that is required to look
 * for updates is extracted and returned.
 *
 * @param {Object} requestBody - Body of the request to parse.
 * @param {Object} requestParams - Params of the request to parse.
 *
 * @returns {Object} Parsed request data with properties `torrentSort, `maxTorrentsPerEpisode`, and
 *                   `startDownload.
 */

function parseRequestData(requestBody, requestParams) {
  // the request body can be used to pass parameters, but they can also be passed in the querystring
  // higher priority is given to the querystring (request params)
  var body = (typeof requestBody === 'string') ? JSON.parse(requestBody) : (requestBody || {}),
    data = utils.mergeObjects(body, requestParams),
    torrentSort = getTorrentSort(data.torrentSort),
    maxTorrentsPerEpisode = parseInt(data.maxTorrentsPerEpisode, 10) || 1,
    startDownload = data.startDownload === true || data.startDownload === 'true';

  return {
    torrentSort: torrentSort,
    maxTorrentsPerEpisode: maxTorrentsPerEpisode,
    startDownload: startDownload
  };
}

/**
 * Handles requests to PUT /subscriptions/:subscriptionName/find.
 */
function checkSubscriptionForUpdates(req, res, next) {
  var parameters = parseRequestData(req.body, req.params),
    // jshint validthis: true
    that = this;

  if (!req.subscription) {
    return next(new restify.BadRequestError('No subscription found with the given name.'));
  }

  that.checkSubscriptionForUpdate(req.subscription, parameters.torrentSort,
    parameters.maxTorrentsPerEpisode, req.log)
    .then(function (data) {
      if (parameters.startDownload) {
        data.forEach(function (torrent) {
          UpdateSubscription.downloadTorrent(req.subscription,
            torrent.season, torrent.episode, that.torrentCommand, torrent.link, req.log);
        });
      }

      utils.sendOkResponse('Found ' +
        (parameters.startDownload && data.length > 0 ? 'and started download of ' : '') +
          data.length + ' new torrents', data, res, next, 'http://' + req.headers.host + req.url);
    })
    .fail(() => next(
      new restify.InternalServerError('All known torrent sites appear to be unavailable.')));
}

/**
 * Handles requests to PUT /subscriptions/find.
 */
function checkAllSubscriptionsForUpdates(req, res, next) {
  var parameters = parseRequestData(req.body, req.params),
    result,
    updateCount = 0,
    // jshint validthis: true
    that = this;

  // retrieve all subscriptions
  Subscription.findAllSubscriptions()
    // continue when updates are found for all subscriptions
    .then(subscriptions => Q.all(subscriptions.map(function (subscription) {
      return that.checkSubscriptionForUpdate(subscription, parameters.torrentSort,
        parameters.maxTorrentsPerEpisode, req.log)
        .then(function (data) {
          // adding a reference to the subscription for starting the torrent a bit futher down...
          data.subscription = subscription;
          return data;
        });
    })))
    .then(function (data) {
      // prepare result
      result = data.filter(function (entry) { return entry.length > 0; });
      result.forEach(function (torrents) {
        updateCount += torrents.length;
      });

      // remove the subscription property from each result entry
      // but only after starting the download - if requested
      result.forEach(function (entry) {
        if (parameters.startDownload) {
          entry.forEach(function (torrent) {
            UpdateSubscription.downloadTorrent(entry.subscription,
                torrent.season, torrent.episode, that.torrentCommand, torrent.link, req.log);
          });
        }
        // we don't need the subscription reference anymore
        delete entry.subscription;
      });

      // done
      utils.sendOkResponse('Checked ' + data.length + ' subscriptions for updates and found ' +
          updateCount + ' new torrents' +
          (parameters.startDownload && updateCount > 0 ? ' which were downloaded' : ''),
          result, res, next, 'http://' + req.headers.host + req.url);
    })
    .fail(() => next(
          new restify.InternalServerError('All known torrent sites appear to be unavailable.')));
}


/**
 * Creates an instance of FindSubscriptionUpdatesHandler.
 *
 * @constructor
 *
 * @param {TorrentSiteManager} torrentSiteManager - TorrentSiteManager instance.
 * @param {String} torrentCommand - Command that should be used to start a torrent.
 * @param {Bunyan.Log} log - Logger instance.
 */
function FindSubscriptionUpdatesHandler(torrentSiteManager, torrentCommand, log) {
  this.torrentSiteManager = torrentSiteManager;
  this.torrentCommand = torrentCommand;
  this.log = log;
  this.checkAllSubscriptionsForUpdates = checkAllSubscriptionsForUpdates;
  this.checkSubscriptionForUpdates = checkSubscriptionForUpdates;

  this.log.info('FindSubscriptionUpdatesHandler created');
}


/**
 * Recursively looks for new episodes of the same season until no torrents are found for a
 * particular episode.
 *
 * @param {Subscription} subscription - Subscription to which the episodes (would) belong.
 * @param {Number} season - Season of the episode to try and find.
 * @param {Number} episode - Episode of the episode to try and find.
 * @param {Array} torrents - Already found torrents.
 * @param {String} torrentSort - Torrent sorting method.
 * @param {Number} maxTorrentsPerEpisode - Maximum number of torrents that should be retrieved
 *                                         for a single episode.
 *
 * @returns {Promise} Promise which resolves to the array of all found torrents.
 */
FindSubscriptionUpdatesHandler.prototype.checkForMultipleEpisodes = function (subscription,
  season, episode, torrents, torrentSort, maxTorrentsPerEpisode) {
  var that = this;

  return this.torrentSiteManager.findTorrents(subscription.name + ' '
      + utils.formatEpisodeNumber(season, episode) + ' ' + subscription.searchParameters,
      season, episode, torrentSort, maxTorrentsPerEpisode)
    .then(function (newTorrents) {
      if (newTorrents && newTorrents.length > 0) {
        // we found torrents, add to list
        torrents = torrents.concat(newTorrents);

        // look for next episode...
        return that.checkForMultipleEpisodes(subscription, season, episode + 1,
          torrents, torrentSort, maxTorrentsPerEpisode);
      }

      // couldn't find the episode, return the torrents we already have
      return torrents;
    });
};

/**
 * Looks for updates of a subscription, both new episodes of the same season, and new episodes
 * of a new season.
 *
 * @param {Subscription} subscription - Subscription to which the episodes (would) belong.
 * @param {String} torrentSort - Torrent sorting method.
 * @param {Number} maxTorrentsPerEpisode - Maximum number of torrents that should be retrieved
 *                                         for a single episode.
 * @param {Bunyan.Log} log - Optional. Logger instance.
 *
 * @returns {Promise} Promise which resolves to the array of all found torrents.
 */
FindSubscriptionUpdatesHandler.prototype.checkSubscriptionForUpdate = function (subscription,
  torrentSort, maxTorrentsPerEpisode, log) {
  var that = this;

  log &&
    log.debug('Checking subscription "%s" for new episodes of same season...', subscription.name);

  // check for new episode of same season
  return this.checkForMultipleEpisodes(subscription, subscription.lastSeason,
      subscription.lastEpisode + 1, [], torrentSort, maxTorrentsPerEpisode)
    .then(function (newEpisodes) {
      // we just finished checking for new episodes of same season
      // no need to update the LastUpdateCheckTime because we're about to check again...

      log &&
        log.debug('Checking subscription "%s" for episodes of new season...', subscription.name);
      return that.checkForMultipleEpisodes(subscription, subscription.lastSeason + 1, 1,
          [], torrentSort, maxTorrentsPerEpisode)
        .then(function (episodes) {
          // we just finished checking for new episodes
          subscription.updateLastUpdateCheckTime();

          // merge episodes from current and new season
          newEpisodes = newEpisodes.concat(episodes);

          return newEpisodes;
        });
    });
};

module.exports = FindSubscriptionUpdatesHandler;

