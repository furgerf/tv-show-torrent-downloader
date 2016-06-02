'use strict';

var restify = require('restify'),
  url = require('url'),

  config = require('./../config'),
  utils = require('./../utils'),

  torrentSites = require('./../torrent-sites/'),

  Subscription = require('./../database/subscription').Subscription;

function getTorrentSort(torrentSort) {
  var sort = (torrentSort || 'largest').toLowerCase();

  if (sort === 'largest') {
    return 'largest';
  }

  if (sort === 'smallest') {
    return 'smallest';
  }

  if (sort === 'newest') {
    return 'newest';
  }

  if (sort === 'oldest') {
    return 'oldest';
  }

  // default
  return 'largest';
}

function checkForEpisode(subscription, season, episode, torrentSort, maxTorrentsPerEpisode, log) {
  return torrentSites.findTorrents(subscription.name + ' ' +
      utils.formatEpisodeNumber(season, episode) + ' ' + subscription.searchParameters,
      season, episode, torrentSort, maxTorrentsPerEpisode)
    .then(function (torrents) {
      return torrents;
    })
    .catch(function () {
      // no torrent was found for that episode
      // TODO: Rethink catch's and do error handling in appropriate places
      // we might have arrived here because no torrents were found
      return null;
    });
}

function checkForMultipleEpisodes(subscription, season, episode,
    torrents, torrentSort, maxTorrentsPerEpisode, log) {
  return checkForEpisode(subscription, season, episode,
    torrentSort, maxTorrentsPerEpisode, log)
    .then(function (newTorrents) {
      if (newTorrents.length > 0) {
        // we found torrents, add to list
        torrents = torrents.concat(newTorrents);

        // look for next episode...
        return checkForMultipleEpisodes(subscription, season, episode + 1,
          torrents, torrentSort, maxTorrentsPerEpisode, log);
      }

      // couldn't find the episode, return the torrents we already have
      return torrents;
    });
}

function checkSubscriptionForUpdate(subscription, torrentSort, maxTorrentsPerEpisode, log) {
  log &&
    log.debug('Checking subscription "%s" for new episodes of same season...', subscription.name);

  // check for new episode of same season
  return checkForMultipleEpisodes(subscription, subscription.lastSeason,
      subscription.lastEpisode + 1, [], torrentSort, maxTorrentsPerEpisode, log)
    .then(function (newEpisodes) {
      // we just finished checking for new episodes
      subscription.updateLastEpisodeUpdateCheck();

      log &&
        log.debug('Checking subscription "%s" for episodes of new season...', subscription.name);
      return checkForMultipleEpisodes(subscription, subscription.lastSeason + 1, 1,
          [], torrentSort, maxTorrentsPerEpisode, log)
        .then(function (episodes) {
          // we just finished checking for new episodes
          subscription.updateLastSeasonUpdateCheck();

          // merge episodes from current and new season
          newEpisodes = newEpisodes.concat(episodes);

          return newEpisodes;
        });
    });
}


exports.checkSubscriptionForUpdates = function (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]),
    torrentSort = getTorrentSort(req.body.torrentSort),
    maxTorrentsPerEpisode = parseInt(req.body.maxTorrentsPerEpisode, 10) || 1;

  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    if (subscriptions.length === 0) {
      req.log.warn('No subscription with name "%s" found', subscriptionName);
      utils.sendOkResponse(res, 'No subscription with name "%s" found', subscriptionName,
          {}, 'http://' + req.headers.host + req.url);
      return next();
    }

    checkSubscriptionForUpdate(subscriptions[0], torrentSort, maxTorrentsPerEpisode, req.log)
      .then(function (data) {
        utils.sendOkResponse(res, 'Found ' + data.length +
            ' new torrents', data, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      });
  });
};

exports.checkAllSubscriptionsForUpdates = function (req, res, next) {
  var result,
    updateCount = 0,
    torrentSort = getTorrentSort(req.body.torrentSort),
    maxTorrentsPerEpisode = parseInt(req.body.maxTorrentsPerEpisode, 10) || 1;

  Subscription.find({}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    Promise.all(subscriptions.map(function (subscription) {
      return checkSubscriptionForUpdate(subscription, torrentSort, maxTorrentsPerEpisode, req.log)
        .then(function (data) {
          return data;
        });
    }))
      .then(function (data) {
        // TODO: double-check this...
        result = data.filter(function (entry) { return entry.length > 0; });
        result.forEach(function (torrents) {
          updateCount += torrents.length;
        });
        utils.sendOkResponse(res, 'Checked ' + subscriptions.length +
            ' subscriptions for updates and found ' + updateCount +
            ' new torrents', result, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      });
  });
};

