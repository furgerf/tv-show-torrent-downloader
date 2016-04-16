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

function checkForEpisode(subscription, season, episode, log) {
  return torrentSites.findTorrent(subscription.name + ' ' + utils.formatEpisodeNumber(season, episode))
    .then(function (torrent) {
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
    })
  .catch(function (err) {
    // TODO: Rethink catch's and do error handling in appropriate places
    // we might have arrived here because no torrents were found
    log.error(err);
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
  log && log.debug('Checking subscription "%s" for updates...', subscription.name);

  // check for new episode of same season
  return checkForMultipleEpisodes(subscription, subscription.lastSeason,
      subscription.lastEpisode + 1, [], log)
    .then(function (newEpisodes) {
      // we just finished checking for new episodes
      subscription.lastEpisodeUpdateCheck = new Date();

      if (newEpisodes.length === 0) {
        // no new episodes, check for new season
        return checkForMultipleEpisodes(subscription, subscription.lastSeason + 1, 1, [], log)
          .then(function (episodes) {
            // we just finished checking for new episodes
            subscription.lastSeasonUpdateCheck = new Date();
            return episodes;
          });
      }

      return newEpisodes;
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
        utils.sendOkResponse(res, 'Started the download of ' + data.length +
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
            ' subscriptions for updates and started the download of ' + updateCount +
            ' new torrents', result, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      });
  });
};

exports.updateSubscriptionWithTorrent = function (req, res, next) {
  return next(new restify.InternalServerError('Not implemented'));
};

