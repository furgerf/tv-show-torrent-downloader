'use strict';

var restify = require('restify'),
  url = require('url'),

  config = require('../common/config'),
  utils = require('../common/utils'),

  torrentSites = require('../torrent-sites/'),

  updateSubscription = require('../endpoints/updateSubscription'),

  Subscription = require('../database/subscription').Subscription;

function getTorrentSort(torrentSort) {
  var sort = (torrentSort || 'largest').toString().toLowerCase();

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
    torrentSort = getTorrentSort(req.body ? req.body.torrentSort : ''),
    maxTorrentsPerEpisode = parseInt(req.body ? req.body.maxTorrentsPerEpisode : 1, 10) || 1,
    startDownload = req.params.startDownload == 'true';

  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    if (subscriptions.length === 0) {
      req.log.warn('No subscription with name "%s" found', subscriptionName);
      return next(new restify.BadRequestError('No subscription with name \'' + subscriptionName + '\''));
    }

    checkSubscriptionForUpdate(subscriptions[0], torrentSort, maxTorrentsPerEpisode, req.log)
      .then(function (data) {
        if (startDownload) {
          data.forEach(function (torrent) {
            updateSubscription.downloadTorrent(subscriptions[0], torrent.season, torrent.episode, torrent.link, req.log);
          });
        }

        utils.sendOkResponse(res, 'Found ' +
            (startDownload && data.length > 0 ? 'and started download of ' : '') +
            data.length + ' new torrents', data, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      });
  });
};

exports.checkAllSubscriptionsForUpdates = function (req, res, next) {
  var result,
    updateCount = 0,
    torrentSort = getTorrentSort(req.body ? req.body.torrentSort : ''),
    maxTorrentsPerEpisode = parseInt(req.body ? req.body.maxTorrentsPerEpisode : 1, 10) || 1,
    startDownload = req.params.startDownload == 'true';

  Subscription.find({}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    Promise.all(subscriptions.map(function (subscription) {
      return checkSubscriptionForUpdate(subscription, torrentSort, maxTorrentsPerEpisode, req.log)
        .then(function (data) {
          // adding a reference to the subscription for starting the torrent a bit futher down...
          data.subscription = subscription;
          return data;
        });
    }))
    .then(function (data) {
      result = data.filter(function (entry) { return entry.length > 0; });
      result.forEach(function (torrents) {
        updateCount += torrents.length;
      });

      // remove the subscription property from each result entry
      // but only after starting the download - if requested
      result.forEach(function (entry) {
        if (startDownload) {
          entry.forEach(function (torrent) {
            updateSubscription.downloadTorrent(entry.subscription, torrent.season, torrent.episode, torrent.link, req.log);
          });
        }
        // we don't need the subscription reference anymore
        delete entry.subscription
      });

      utils.sendOkResponse(res, 'Checked ' + subscriptions.length +
          ' subscriptions for updates and found ' +
          (startDownload && updateCount > 0 ? 'and started download of ' : '' + updateCount) +
          ' new torrents', result, 'http://' + req.headers.host + req.url);
      res.end();
      return next();
    });
  });
};

