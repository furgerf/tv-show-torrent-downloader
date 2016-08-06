'use strict';

var restify = require('restify'),
  exec = require('child_process').exec,
  Q = require('q'),

  config = require('./../common/config'),
  utils = require('./../common/utils'),

  Subscription = require('./../database/subscription').Subscription;


function isNextOrSameEpisode(sub, season, episode) {
  return (
    // same season and same or next episode
    (season === sub.lastSeason && (episode === sub.lastEpisode || episode === sub.lastEpisode + 1))
    // *OR* first episode of next season
    || (season === sub.lastSeason + 1 && (episode === 0 || episode === 1)));
}

function startTorrent(torrentLink, log) {
  var command = config.torrentCommand + " '" + torrentLink + "'";

  log && log.warn('Starting torrent: %s (command: %s)', torrentLink, command);

  return Q.fcall(function () {
    exec(command, function (err, stdout, stderr) {
      if (err) {
        log ? log.error(err) : console.log(err);
        throw err;
      }

      if (stderr) {
        log
          ? log.warn('Torrent command stderr: %s', stderr)
          : console.log('Torrent command stderr: ' + stderr);
      }
      if (stdout) {
        log
          ? log.info('Torrent command stdout: %s', stdout)
          : console.log('Torrent command stdout: ' + stdout);
      }
    });
  });
}

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

function updateSubscriptionWithTorrent (req, res, next) {
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

    exports.downloadTorrent(sub, season, episode, link, req.log)
      .then (function () {
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

exports.downloadTorrent = downloadTorrent;
exports.updateSubscriptionWithTorrent = updateSubscriptionWithTorrent;

