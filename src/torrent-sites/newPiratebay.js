'use strict';

var urlModule = require('url'),
  utils = require('./../common/utils');

/**
 * Parses the size of a torrent.
 *
 * @param {String} str - Size data that was retrieved from the torrent site.
 *
 * @returns {Number} Size of the torrent in bytes if `str` was parsed successfully, otherwise null.
 */
function parseSize(str) {
  if (str == undefined)
  {
    return null;
  }

  var data = str.match(/(\d+(?:\.\d+)?).*\b(.{2}B).*/);
  return utils.fileSizeToBytes(parseInt(data[1], 10), data[2]);
}

/**
 * Parses a date from the current year.
 *
 * @param {Array}  dateThisYear - Data that was parsed from the regex.
 * @param {String} dateThisYear[0] - Complete match - ignored.
 * @param {String} dateThisYear[1] - Month.
 * @param {String} dateThisYear[2] - Day.
 * @param {String} dateThisYear[3] - Hour.
 * @param {String} dateThisYear[4] - Minute.
 *
 * @returns {Date} Parsed date.
 */
function parseDateThisYear(dateThisYear) {
  return new Date(
      new Date().getFullYear(),
      parseInt(dateThisYear[1], 10) - 1,
      parseInt(dateThisYear[2], 10),
      parseInt(dateThisYear[3], 10),
      parseInt(dateThisYear[4], 10)
      );
}

/**
 * Parses a date from the last year.
 *
 * @param {Array}  dateOtherYear - Data that was parsed from the regex.
 * @param {String} dateOtherYear[0] - Complete match - ignored.
 * @param {String} dateOtherYear[1] - Month.
 * @param {String} dateOtherYear[2] - Day.
 * @param {String} dateOtherYear[3] - Year.
 *
 * @returns {Date} Parsed date.
 */
function parseDateLastYear(dateOtherYear) {
  return new Date(
      parseInt(dateOtherYear[3], 10),
      parseInt(dateOtherYear[1], 10) - 1,
      parseInt(dateOtherYear[2], 10),
      0,
      0
      );
}

/**
 * Parses a date from today.
 *
 * @param {Array}  dateOtherYear - Data that was parsed from the regex.
 * @param {String} dateOtherYear[0] - Complete match - ignored.
 * @param {String} dateOtherYear[1] - Hours.
 * @param {String} dateOtherYear[2] - Minutes.
 *
 * @returns {Date} Parsed date.
 */
function parseDateToday(dateToday) {
  var date = new Date();
  date.setHours(parseInt(dateToday[1], 10));
  date.setMinutes(parseInt(dateToday[2], 10));
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
}

/**
 * Parses a date from yesterday.
 *
 * @param {Array}  dateOtherYear - Data that was parsed from the regex.
 * @param {String} dateOtherYear[0] - Complete match - ignored.
 * @param {String} dateOtherYear[1] - Hours.
 * @param {String} dateOtherYear[2] - Minutes.
 *
 * @returns {Date} Parsed date.
 */
function parseDateYesterday(dateYesterday) {
  var date = new Date();
  date.setDate(date.getDate()-1);
  date.setHours(parseInt(dateYesterday[1], 10));
  date.setMinutes(parseInt(dateYesterday[2], 10));
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
}

/**
 * Parses a date.
 *
 * @param {String} str - Date data that was retrieved from the torrent site.
 *
 * @returns {Date} Parsed date if parsed successfully, null otherwise.
 */
function parseDate(str) {
  var dateThisYear = str.match(/(\d{2})-(\d{2}).*;(\d{2}):(\d{2})/),
    dateOtherYear = str.match(/(\d{2})-(\d{2}).*;(\d{4})/),
    dateToday = str.match(/Today.*;(\d{2}):(\d{2})/),
    dateYesterday = str.match(/Y-day.*;(\d{2}):(\d{2})/);

  if (dateThisYear !== null) {
    return parseDateThisYear(dateThisYear);
  } else if (dateOtherYear !== null) {
    return parseDateLastYear(dateOtherYear);
  } else if (dateToday !== null) {
    return parseDateToday(dateToday);
  } else if (dateYesterday !== null) {
    return parseDateYesterday(dateYesterday);
  }

  return null;
}

/**
 * Parser constructor. Throws an error if no `url` is provided.
 *
 * @param {String} url - Is used by the torrent-site index to build the search URL.
 * @param {Bunyan.Log} log - Logger instance.
 */
module.exports = function (url, log) {
  if (!url || !url.toString()) {
    throw new Error('Must provide valid URL');
  }

  this.url = 'http://' + url + '/search/';

  /**
   * Parses the torrent data.
   *
   * @param {String} html - HTML response from the search.
   * @param {Number} season - Season which was searched for.
   * @param {Number} episode - Episode which was searched for.
   *
   * @returns {Object} Torrent information if parsing was successful, null otherwise. Properties:
   *                   {String} name - Name of the torrent.
   *                   {Number} season - Season of the torrent.
   *                   {Number} episode - Episode of the torrent.
   *                   {Number} seeders - Seeders of the torrent.
   *                   {Number} leechers - Leechers of the torrent.
   *                   {Number} size - Size in bytes of the torrent.
   *                   {Date} uploadDate - Date when the torrent was uploaded.
   *                   {String} link - Link to the torrent.
   */
  this.parseTorrentData = function (html, season, episode) {
    try {
      var magnetRegexp = /<a href="magnet:?/,
        torrentInfoRegexp = /.*Uploaded(.*)\,.*Size(.*)\,/,
        extractCellContentRegexp = /<td.*>(.*)<\/td>/,

        torrents = [];

      // log.warn(this.url + season + " - " + episode);

      html.split('\n').forEach(function (line, index, lines) {
        if (line.match(magnetRegexp)) {
          // log.error("00000000000000000")
          // log.error(lines[index-5])
          // log.error(lines[index-4])
          // log.error(lines[index-3])
          // log.error(lines[index-2])
          // log.error(lines[index-1])
          // log.error(line)
          // log.error(lines[index+1])
          // log.error(lines[index+2])
          // log.error(lines[index+3])
          // log.error(lines[index+4])
          // log.error(lines[index+5])
          // log.error(lines[index+6])
          var splitLine = line.split('"'),
            link = decodeURI(splitLine[1]), // TODO: check that all trackers are added
            queryData = urlModule.parse(link, true),
            torrentName = queryData.query.dn,
            seederLine = lines[index + 2],
            leecherLine = lines[index + 3],
            infos = (splitLine[36] || splitLine[26]).split(','),
            uploadDate = parseDate(infos[0]),
            size = parseSize(infos[1]),
            seeders = parseInt(seederLine.match(extractCellContentRegexp)[1], 10),
            leechers = parseInt(leecherLine.match(extractCellContentRegexp)[1], 10);

          torrents.push({
            name: torrentName,
            season: season,
            episode: episode,
            seeders: seeders,
            leechers: leechers,
            size: size,
            uploadDate: uploadDate,
            link: link
          });
        }
      });

      return torrents;
    } catch (err) {
      log.warn('Torrent parsing error: ' + err);
      return null;
    }
  };
};

