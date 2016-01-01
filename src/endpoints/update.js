'use strict';

var restify = require('restify'),
  exec = require('child_process').exec,
  url = require('url'),

  config = require('./../config'),
  utils = require('./../utils'),

  Subscription = require('./../database/subscription').Subscription;

function parseTorrentSearch(html) {
  var magnetRegexp = /<a href="magnet:?/,
    torrentInfoRegexp = /.*Uploaded(.*)\,.*Size(.*)\,/,

    torrents = [];

  html.split('\n').forEach(function (line, index, lines) {
    if (line.match(magnetRegexp)) {
      var link = decodeURI(line.split('"')[1]), // TODO: check that all trackers are added
        queryData = url.parse(link, true),
        torrentName = queryData.query.dn,

        infoLine = lines[index + 1],
        infos = infoLine.match(torrentInfoRegexp),
        uploadDate = utils.parseDate(infos[1]),
        size = utils.parseSize(infos[2]);

      torrents.push({
        name: torrentName,
        size: size,
        uploadDate: uploadDate,
        link: link
      });
    }
  });

  return torrents;
}

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
  var torrentUrl = 'http://thepiratebay.mn/search/',
    url = encodeURI(torrentUrl + subscription.name + ' ' +
        utils.formatEpisodeNumber(season, episode));

  log && log.debug('Checking whether %s %s is available for download with url %s',
      subscription.name, utils.formatEpisodeNumber(season, episode), url);

  return new Promise(function (resolve, reject) {
    exec('wget -O- ' + url, function (err, stdout, stderr) {
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
          log.warn('Wget stderr: %s', stderr);
        } else {
          console.log('Wget stderr: %s', stderr);
        }
      }

      var torrents = parseTorrentSearch(stdout),

        // select one (or several?) of the torrents to download
        // at the moment, select the largest one
        maxSize = Math.max.apply(Math, torrents.map(function (torrent) { return torrent.size; })),
        torrent = torrents.filter(function (t) { return t.size === maxSize; })[0];

      log.debug('Episode %s of show %s was%s found!', utils.formatEpisodeNumber(season, episode),
          subscription.name, torrent ? '' : ' NOT');

      if (torrent) {
        if (subscription.updateLastEpisode(season, episode)) {
          log && log.info('Successfully updated subscription %s to %s, starting torrent...',
              subscription.name, utils.formatEpisodeNumber(subscription.lastSeason,
                subscription.lastEpisode));
          startTorrent(torrent.link, log);
        }
      }

      resolve(torrent);
    });
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

exports.checkForUpdates = function (req, res, next) {
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
          subscription.save();
          return data;
        });
    }))
      .then(function (data) {
        result = data.filter(function (entry) { return entry.length > 0; });
        result.forEach(function (torrents) {
          updateCount += torrents.length;
        });
        utils.sendOkResponse(res, 'Checked ' + subscriptions.length +
            ' subscriptions for updates and started the download of ' + updateCount +
            ' new torrents', data, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      });
  });
};

