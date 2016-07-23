'use strict';

var url = require('url'),
  utils = require('./../common/utils');

function parseSize(str) {
  var data = str.match(/(\d+(?:\.\d+)?).*\b(.{2}B).*/);
  return utils.fileSizeToBytes(parseInt(data[1], 10), data[2]);
}

// TODO: split into two sub-functions
function parseDate(str) {
  var dataThisYear = str.match(/(\d{2})-(\d{2}).*;(\d{2}):(\d{2})/),
    dataOtherYear = str.match(/(\d{2})-(\d{2}).*;(\d{4})/),
    dataToday = str.match(/Today.*;(\d{2}):(\d{2})/),
    date;

  if (dataThisYear !== null) {
    date = new Date(
      new Date().getFullYear(),
      parseInt(dataThisYear[1], 10) - 1,
      parseInt(dataThisYear[2], 10),
      parseInt(dataThisYear[3], 10),
      parseInt(dataThisYear[4], 10)
    );
  } else if (dataOtherYear !== null) {
    date = new Date(
      parseInt(dataOtherYear[3], 10),
      parseInt(dataOtherYear[1], 10) - 1,
      parseInt(dataOtherYear[2], 10),
      0,
      0
    );
  } else if (dataToday !== null) {
    date = new Date();
    date.setHours(parseInt(dataToday[1], 10));
    date.setMinutes(parseInt(dataToday[2], 10));
    date.setSeconds(0);
    date.setMilliseconds(0);
  }

  if (date > new Date()) {
    date.setFullYear(date.getFullYear() - 1);
  }

  return date;
}

function parseTorrentData(html, season, episode) {
  try {
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
          uploadDate = parseDate(infos[1]),
          size = parseSize(infos[2]),
          seeds = -1,
          leechers = -1;

        torrents.push({
          name: torrentName,
          season: season,
          episode: episode,
          seeds: seeds,
          leechers: leechers,
          size: size,
          uploadDate: uploadDate,
          link: link
        });
      }
    });

    return torrents;
  } catch (err) {
    console.log('Torrent parsing error: ' + err);
    return null;
  }
}

function Parser (url) {
  if (!url || !url.toString()) {
    throw new ArgumentException('Must provide valid URL ending');
  }

  this.url = 'http://' + url + '/search/';
  this.parseTorrentData = parseTorrentData;
}

exports.Parser = Parser;

