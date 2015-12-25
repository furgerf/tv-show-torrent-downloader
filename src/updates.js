var restify = require('restify'),
    exec = require('child_process').exec,
    url = require('url'),

    config = require('./config'),
    database = require('./database'),
    utils = require('./utils'),

    Subscription = database.Subscription;

function parseTorrentSearch(html) {
  const magnetRegexp = /<a href="magnet:?/,
        torrentInfoRegexp = /.*Uploaded(.*)\,.*Size(.*)\,/;

  var torrents = [];

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
        if (log) log.error(err);
        else  console.log(err);

        return err;
      }

      if (stderr) {
        if (log) log.warn('Torrent command stderr: %s', stderr);
        else console.log('Torrent command stderr: %s', stderr);
      }

      if (stdout) {
        if (log) log.info('Torrent command stdout: %s', stdout);
        else console.log('Torrent command stdout: %s', stdout);
      }
  });
}

function checkForEpisode(showName, season, episode, log) {
  const torrentUrl = 'http://thepiratebay.mn/search/';

  var url = encodeURI(torrentUrl + showName + ' ' + utils.formatEpisodeNumber(season, episode));

  log && log.debug('Checking whether %s %s is available for download with url %s', showName, utils.formatEpisodeNumber(season, episode), url);

  return new Promise(function (resolve, reject) {
    exec('wget -O- ' + url, function (err, stdout, stderr) {
      if (err) {
        if (log) log.error(err);
        else  console.log(err);

        return err;
      }

      var torrents = parseTorrentSearch(stdout),

          // select one (or several?) of the torrents to download
          // at the moment, select the largest one
          maxSize = Math.max.apply(Math, torrents.map(function(torrent){ return torrent.size; })),
          torrent = torrents.filter(function (t) { return t.size === maxSize; })[0];

      if (torrent) {
        startTorrent(torrent.link, log);
      }

      //resolve(Math.random()<.5 ? torrent : undefined);
      resolve(torrent);
    });
  });
}

function checkForMultipleEpisodes(showName, season, episode, torrents, log) {
  return checkForEpisode(showName, season, episode, log)
    .then (function (torrent) {
      if (torrent) {
        // we found the episode, add to list
        torrents.push(torrent);

        // look for next episode...
        return checkForMultipleEpisodes(showName, season, episode + 1, torrents, log);
      }

      // couldn't find the episode, return the torrents we already have
      return torrents;
    });
}

function checkSubscriptionForUpdate(subscription, log) {
  // TODO: Update database entry (update check date)

  log && log.debug('Checking subscription "%s" for updates...', subscription.name);

  // check for new episode of same season
  return checkForMultipleEpisodes(subscription.name, subscription.lastSeason, subscription.lastEpisode + 1, [], log)
    .then (function (newEpisodes) {
      if (newEpisodes.length === 0) {
        // no new episodes, check for new season
        return checkForMultipleEpisodes(subscription.name, subscription.lastSeason + 1, 1, [], log);
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
      return next(new restify.InternalServerError('Something went wrong when accessing the database.'));
    }

    Promise.all(subscriptions.map(function (subscription) {
      return checkSubscriptionForUpdate(subscription, req.log);
    }))
    .then (function (data) {
      result = data.filter(function (entry) { return entry.length > 0; });
      result.forEach(function (torrents) {
        updateCount += torrents.length;
      });
      utils.sendOkResponse(res, 'Checked ' + subscriptions.length + ' subscriptions for updates and started the download of ' + updateCount + ' new torrents', data, 'http://' + req.headers.host + req.url);
      res.end();
      return next();
    });
  });
};

