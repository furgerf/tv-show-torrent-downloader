'use strict';

var config = require('./config'),
  pirateBayMn = require('./torrent-sites/piratebay.mn.js'),
  log = require('./logger').log.child({component: 'torrents'}),

  pirateBayMnSite = 'piratebay.mn';

/**
 * Parses the size of a torrent, depending on the torrent site's format.
 *
 * @param {String} str - String representing the size that should be parsed.
 *
 * @returns {Number} Number of bytes of the torrent.
 */
function parseSize(str) {
  switch (config.torrentSite) {
  case pirateBayMnSite:
    return pirateBayMn.parseSize(str);
  default:
    log.error('Requesting unknown torrent site: "%s"', config.torrentSite);
    return -1;
  }
}

/**
 * Parses the upload date of the torrent, depending on the torrent site's format.
 *
 * @param {String} str - String representing the date that should be parsed.
 *
 * @returns {Date} Date of the torrent.
 */
function parseDate(str) {
  switch (config.torrentSite) {
  case pirateBayMnSite:
    return pirateBayMn.parseDate(str);
  default:
    log.error('Requesting unknown torrent site: "%s"', config.torrentSite);
    return -1; // TODO: Try to return invalid date instead (or null/undefined?)
  }
}

exports.parseDate = parseDate;
exports.parseDate = parseDate;

