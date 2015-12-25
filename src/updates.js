var request = require('request'),
    restify = require('restify'),
    JSZip = require('jszip'),
    //wget = require('wget-improved'),
    exec = require('child_process').exec,
    url = require('url'),

    config = require('./config'),
    database = require('./database'),
    utils = require('./utils'),

    Subscription = database.Subscription;

const torrentUrl = 'http://thepiratebay.mn/search/',
      magnetRegexp = /<a href="magnet:?/,
      torrentInfoRegexp = /.*Uploaded(.*)\,.*Size(.*)\,/;

function fileSizeToBytes(number, unit) {
  switch (unit) {
    case 'KiB':
      return number * 1024;
    case 'MiB':
      return number * Math.pow(1024, 2);
    case 'GiB':
      return number * Math.pow(1024, 3);
    case 'KB':
      return number * 1000;
    case 'MB':
      return number * Math.pow(1000, 2);
    case 'GB':
      return number * Math.pow(1000, 3);
  }

  return -1;
}

function twoDigitNumber(num) {
  return ('0' + num).slice(-2);
}

function formatEpisodeNumber(season, episode) {
  return 'S' + twoDigitNumber(season) + 'E' + twoDigitNumber(episode);
}

function parseSize(str) {
  var data = str.match(/(\d+(?:\.\d+)?).*\b(.{2}B).*/);
  return fileSizeToBytes(parseInt(data[1], 10), data[2]);
}

function parseDate(str) {
  var data = str.match(/(\d{2})-(\d{2}).*;(\d{2}):(\d{2})/),
      date = new Date(new Date().getFullYear(), parseInt(data[1], 10) - 1, parseInt(data[2], 10), parseInt(data[3], 10), parseInt(data[4], 10));

  if (date > new Date()) {
    date.setFullYear(date.getFullYear() - 1);
  }

  return date;
}

function parseTorrentSearch(html) {
  var torrents = [];

  html.split('\n').forEach(function (line, index, lines) {
    if (line.match(magnetRegexp)) {
      var link = decodeURI(line.split('"')[1]), // TODO: check that all trackers are added
          queryData = url.parse(link, true),
          torrentName = queryData.query.dn,

          infoLine = lines[index + 1],
          infos = infoLine.match(torrentInfoRegexp),
          uploadDate = parseDate(infos[1]),
          size = parseSize(infos[2]);

      torrents.push({
        Name: torrentName,
        Size: size,
        UploadDate: uploadDate,
        Link: link
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
  // TODO: also add searchparameters
  var url = encodeURI(torrentUrl + showName + ' ' + formatEpisodeNumber(season, episode));
  log && log.debug('Checking whether %s %s is available for download with url %s', showName, formatEpisodeNumber(season, episode), url);
  return new Promise(function (resolve, reject) {
    exec('wget -O- ' + url, function (err, stdout, stderr) {
    //require('fs').readFile('fargo', 'utf8', function (err,data) {
      if (err) {
        if (log) log.error(err);
        else  console.log(err);

        return err;
      }
      var torrents = parseTorrentSearch(stdout),

          // select one (or several?) of the torrents to download
          // at the moment, select the largest one
          maxSize = Math.max.apply(Math, torrents.map(function(torrent){ return torrent.Size; })),
          torrent = torrents.filter(function (t) { return t.Size === maxSize; })[0];

      if (torrent) {
        startTorrent(torrent.Link, log);
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

