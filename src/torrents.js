'use strict';

var config = require('./config'),
    pirateBayMn = require('./torrent-sites/piratebay.mn.js'),
    log = require('./logger').log.child({component: 'torrents'}),

const pirateBayMnSite = 'piratebay.mn';

/**
 * Parses the size of a torrent, depending on the torrent site's format.
 * @param str String representing the size that should be parsed
 */
exports.parseSize = function (str) {
  switch (config.torrentSite) {
    case pirateBayMnSite:
      return pirateBayMn.parseSize(str);
    default:
      log.error('Requesting unknown torrent site: "%s"', config.torrentSite);
      return -1;
  }
};

/**
 * Parses the upload date of the torrent, depending on the torrent site's format.
 * @param str String representing the date that should be parsed
 */
exports.parseDate = function (str) {
  switch (config.torrentSite) {
    case pirateBayMnSite:
      return pirateBayMn.parseDate(str);
    default:
      log.error('Requesting unknown torrent site: "%s"', config.torrentSite);
      return -1; // TODO: Try to return invalid date instead (or null/undefined?)
  }
};

