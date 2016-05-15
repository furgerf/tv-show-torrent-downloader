'use strict';

var restify = require('restify'),
  exec = require('child_process').exec,
  url = require('url'),

  config = require('./../config'),
  utils = require('./../utils'),

  torrentSites = require('./../torrent-sites/'),

  Subscription = require('./../database/subscription').Subscription;


function checkForEpisode(subscription, season, episode, log) {
  return torrentSites.findTorrent(subscription.name + ' ' + utils.formatEpisodeNumber(season, episode) + ' ' + subscription.searchParameters)
    .then(function (torrent) {
      return torrent;
      /*
      if (subscription.updateLastEpisode(season, episode)) {
        if (config.productionEnvironment) {
          subscription.save();
        }
        log && log.info('Successfully updated subscription %s to %s, starting torrent...',
            subscription.name, utils.formatEpisodeNumber(subscription.lastSeason,
              subscription.lastEpisode));
        startTorrent(torrent.link, log);
        return torrent;
      } else {
        log && log.error('Failed to update subscription %s to %s!', subscription.name,
            utils.formatEpisodeNumber(subscription.lastSeason, subscription.lastEpisode));
        reject();
      }
      */
    })
  .catch(function (err) {
    // no torrent was found for that episode
    // TODO: Rethink catch's and do error handling in appropriate places
    // we might have arrived here because no torrents were found
    //log.error(err);
    return null;
  });
}

function checkForMultipleEpisodes(subscription, season, episode, torrents, log) {
  return checkForEpisode(subscription, season, episode, log)
    .then(function (torrent) {
      if (torrent) {
        // we found the episode, add to list
        torrents.push(torrent);

        // look for next episode...
        return checkForMultipleEpisodes(subscription, season, episode + 1, torrents, log);
      }

      // couldn't find the episode, return the torrents we already have
      return torrents;
    });
}

function checkSubscriptionForUpdate(subscription, log) {
  log && log.debug('Checking subscription "%s" for new episodes of same season...', subscription.name);

  // check for new episode of same season
  return checkForMultipleEpisodes(subscription, subscription.lastSeason,
      subscription.lastEpisode + 1, [], log)
    .then(function (newEpisodes) {
      // we just finished checking for new episodes
      subscription.lastEpisodeUpdateCheck = new Date();

      log && log.debug('Checking subscription "%s" for episodes of new season...', subscription.name);
      return checkForMultipleEpisodes(subscription, subscription.lastSeason + 1, 1, [], log)
        .then(function (episodes) {
          // we just finished checking for new episodes
          subscription.lastSeasonUpdateCheck = new Date();

          // merge episodes from current and new season
          newEpisodes = newEpisodes.concat(episodes);

          return newEpisodes;
        });
    });
}


exports.checkSubscriptionForUpdates = function (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]);

  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    if (subscriptions.length === 0) {
      req.log.warn('No subscription with name "%s" found', subscriptionName);
      utils.sendOkResponse(res, 'No subscription with name "%s" found', subscriptionName, {}, 'http://' + req.headers.host + req.url);
      return next();
    }

    checkSubscriptionForUpdate(subscriptions[0], req.log)
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
    updateCount = 0;

  Subscription.find({}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    Promise.all(subscriptions.map(function (subscription) {
      return checkSubscriptionForUpdate(subscription, req.log)
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

