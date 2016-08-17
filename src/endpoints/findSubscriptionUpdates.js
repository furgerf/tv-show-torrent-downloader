'use strict';

var restify = require('restify'),
  Q = require('q'),

  utils = require('../common/utils'),

  torrentSites = require('../torrent-sites/'),

  updateSubscription = require('../endpoints/updateSubscription'),

  database = require('../database/subscription');

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
function checkForMultipleEpisodes(subscription, season, episode,
    torrents, torrentSort, maxTorrentsPerEpisode) {
  return torrentSites.findTorrents(subscription.name + ' '
      + utils.formatEpisodeNumber(season, episode) + ' ' + subscription.searchParameters,
      season, episode, torrentSort, maxTorrentsPerEpisode)
    .then(function (newTorrents) {
      if (newTorrents && newTorrents.length > 0) {
        // we found torrents, add to list
        torrents = torrents.concat(newTorrents);

        // look for next episode...
        return checkForMultipleEpisodes(subscription, season, episode + 1,
          torrents, torrentSort, maxTorrentsPerEpisode);
      }

      // couldn't find the episode, return the torrents we already have
      return torrents;
    });
}

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
function checkSubscriptionForUpdate(subscription, torrentSort, maxTorrentsPerEpisode, log) {
  log &&
    log.debug('Checking subscription "%s" for new episodes of same season...', subscription.name);

  // check for new episode of same season
  return checkForMultipleEpisodes(subscription, subscription.lastSeason,
      subscription.lastEpisode + 1, [], torrentSort, maxTorrentsPerEpisode)
    .then(function (newEpisodes) {
      // we just finished checking for new episodes
      subscription.updateLastUpdateCheckTime();

      log &&
        log.debug('Checking subscription "%s" for episodes of new season...', subscription.name);
      return checkForMultipleEpisodes(subscription, subscription.lastSeason + 1, 1,
          [], torrentSort, maxTorrentsPerEpisode)
        .then(function (episodes) {
          // we just finished checking for new episodes
          subscription.updateLastUpdateCheckTime();

          // merge episodes from current and new season
          newEpisodes = newEpisodes.concat(episodes);

          return newEpisodes;
        });
    });
}

/**
 * Handles requests to PUT /subscriptions/:subscriptionName/find.
 */
function checkSubscriptionForUpdates(req, res, next) {
  var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body,
    subscriptionName = decodeURIComponent(req.params[0]),
    torrentSort = getTorrentSort(body ? body.torrentSort : req.params.torrentSort),
    maxTorrentsPerEpisode = parseInt(body
        ? body.maxTorrentsPerEpisode
        : req.params.maxTorrentsPerEpisode, 10) || 1,
    startDownload = req.params.startDownload === true || req.params.startDownload === 'true';

  database.findSubscriptionByName(subscriptionName)
    .then(subscription => subscription
        ? subscription
        : next(new restify.BadRequestError("No subscription named '" + subscriptionName + "'.")))
    .then(function (subscription) {
      return checkSubscriptionForUpdate(subscription, torrentSort, maxTorrentsPerEpisode, req.log)
        .then(function (data) {
          if (startDownload) {
            data.forEach(function (torrent) {
              updateSubscription.downloadTorrent(subscription,
                  torrent.season, torrent.episode, torrent.link, req.log);
            });
          }

        utils.sendOkResponse('Found ' +
            (startDownload && data.length > 0 ? 'and started download of ' : '') +
            data.length + ' new torrents', data, res, next, 'http://' + req.headers.host + req.url);
        });
    })
    .fail(() => next(
        new restify.InternalServerError('All known torrent sites appear to be unavailable.')));
}

/**
 * Handles requests to PUT /subscriptions/find.
 */
function checkAllSubscriptionsForUpdates(req, res, next) {
  var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body,
    result,
    updateCount = 0,
    torrentSort = getTorrentSort(body ? body.torrentSort : req.params.torrentSort),
    maxTorrentsPerEpisode = parseInt(body
        ? body.maxTorrentsPerEpisode
        : req.params.maxTorrentsPerEpisode, 10) || 1,
    startDownload = req.params.startDownload === true || req.params.startDownload === 'true';

  // retrieve all subscriptions
  database.findAllSubscriptions()
    // continue when updates are found for all subscriptions
    .then(subscriptions => Q.all(subscriptions.map(function (subscription) {
      return checkSubscriptionForUpdate(subscription, torrentSort, maxTorrentsPerEpisode, req.log)
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
        if (startDownload) {
          entry.forEach(function (torrent) {
            updateSubscription.downloadTorrent(entry.subscription,
                torrent.season, torrent.episode, torrent.link, req.log);
          });
        }
        // we don't need the subscription reference anymore
        delete entry.subscription;
      });

      // done
      utils.sendOkResponse('Checked ' + data.length + ' subscriptions for updates and found ' +
          (startDownload && updateCount > 0 ? 'and started download of ' : '' + updateCount) +
          ' new torrents', result, res, next, 'http://' + req.headers.host + req.url);
    })
    .fail(() => next(
          new restify.InternalServerError('All known torrent sites appear to be unavailable.')));
}

exports.checkAllSubscriptionsForUpdates = checkAllSubscriptionsForUpdates;
exports.checkSubscriptionForUpdates = checkSubscriptionForUpdates;

