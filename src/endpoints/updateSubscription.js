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

  return new Promise(function (resolve, reject) {
    exec(command, function (err, stdout, stderr) {
      if (err) {
        if (log) {
          log.error(err);
        } else {
          console.log(err);
        }

        reject(err);
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

      resolve();
    });
  });
}

function isNextOrSameEpisode(sub, season, episode) {
  if (episode === 0 || episode === 1) {
    return true;
  }

  if (season === sub.lastSeason && (episode === sub.lastEpisode || episode === sub.lastEpisode + 1)) {
    return true;
  }

  return false;
}

exports.downloadTorrent = function (sub, season, episode, link, log) {
  return startTorrent(link, log)
    .then(function () {
      // update subscription if necessary
      if (config.productionEnvironment) {
        if (sub.updateLastEpisode(season, episode)) {
          sub.save();
          log && log.info('Successfully updated subscription %s to %s...',
              sub.name, utils.formatEpisodeNumber(sub.lastSeason,
                sub.lastEpisode));
        } else {
          log && log.error('Failed to update subscription %s to %s!', sub.name,
              utils.formatEpisodeNumber(sub.lastSeason, sub.lastEpisode));
          return next(new restify.InternalServerError(
                'Error while updating subscription: Could not update database.'
                ));
        }
      }
    });
}

exports.updateSubscriptionWithTorrent = function (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]),
    season = parseInt(req.body.season, 10),
    episode = parseInt(req.body.episode, 10),
    link = req.body.link;

  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    if (subscriptions.length === 0) {
      req.log.warn('No subscription with name "%s" found', subscriptionName);
      return next(new restify.BadRequestError('No subscription with name \'' + subscriptionName + '\''));
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

    exports.downloadTorrent(sub, season, episode, link, req.log)
      .then (function () {
        utils.sendOkResponse(res, 'Started torrent for new episode '
            + utils.formatEpisodeNumber(season, episode) + ' of ' + sub.name,
            null, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      })
    .catch(function (error) {
      return next(
          new restify.InternalServerError('Error while trying to start torrent: %s', error)
          );
    });
  });
};

