'use strict';

/**
 * This file must know all torrent-parsing-sites. Each torrent-parsing-site must export a
 * class named 'Parser' which contains the field 'url' and the function 'parseTorrentData'.
 */

var Q = require('q'),
  exec = require('child_process').exec,

  PirateBay = require('./piratebay'),
  NewPirateBay = require('./newPiratebay'),

  torrentComparer = {
    'largest': (t1, t2) => t1.size < t2.size,
    'smallest': (t1, t2) => t1.size > t2.size,
    'newest': (t1, t2) => t1.uploadDate < t2.uploadDate,
    'oldest': (t1, t2) => t1.uploadDate > t2.uploadDate,
    'mostseeded': (t1, t2) => t1.seeders < t2.seeders,
    };

/**
 * Compares two torrents according to the specified sorting method.
 * NOTE: This should be refactored and also return -1/0/1 instead of true/false.
 *
 * @param {Object} t1 - Torrent 1 to compare.
 * @param {Object} t2 - Torrent 2 to compare.
 * @param {String} sort - Sorting method.
 *
 * @returns {Boolean} True if the torrents should be swapped, false if they're already in order.
 */
function compareTorrents (t1, t2, sort) {
  [t1, t2].forEach(function (t) {
    if (!t || typeof t !== 'object') {
      throw new Error('Invalid arguments, t1 and t2 must be objects');
    }
  });

  if (!torrentComparer[sort]) {
    throw new Error('Unknown sort: ' + sort);
  }

  return torrentComparer[sort](t1, t2);
}

/**
 * Creates an instance of TorrentSiteManager.
 *
 * @constructor
 *
 * @param {Bunyan.Log} log - Logger instance.
 */
module.exports = function TorrentSiteManager (log) {
  var hiddenBay = new NewPirateBay('thehiddenbay.com', log),
    pirateBayRocks = new NewPirateBay('thepiratebay.rocks', log),
    pirateProxyLive= new NewPirateBay('pirateproxy.live', log),
    pirateBayOrg = new PirateBay('thepiratebay.org', log),
    pirateBayMn = new PirateBay('thepiratebay.mn', log),
    pirateBaySe = new PirateBay('thepiratebay.se', log),
    pirateBayPe = new PirateBay('pirateproxy.pe', log),
    pirateBayAhoy = new PirateBay('ahoy.one', log),
    pirateBayPatatje = new PirateBay('tpb.patatje.eu', log),
    // invalidParser = new PirateBay('foobar', log),

    that = this;

  this.allSites = [
    hiddenBay,
    pirateBayRocks,
    pirateProxyLive,
    pirateBayOrg,
    // pirateBayPatatje,
    // pirateBayAhoy,
    // pirateBayPe,
    // pirateBaySe,
    // pirateBayMn,
    // invalidParser,
  ];


  /**
   * Tries to find torrents on all known torrent sites.
   * NOTE: Currently, siteIndex must STAY the last parameter, that should be refactored.
   *
   * @param {String} searchString - Additional search string.
   * @param {Number} season - Season of the torrent to look for.
   * @param {Number} episode - Episode of the torrent to look for.
   * @param {String} torrentSort - Torrent sorting method.
   * @param {Number} maxTorrentsPerEpisode - Maximum number of torrents to return.
   * @param {Number} siteIndex - Index of the torrent site to try. When called externally, this
   *                             parameter shouldn't be specified, it's used for recursive calls
   *                             when iterating through the different torrent sites.
   *
   * @returns {Promise} Promise that resolves to an array containing all found torrents or rejects
   *                    in case all torrent sites fail.
   */
  this.findTorrents = function (searchString, season, episode,
    torrentSort, maxTorrentsPerEpisode, siteIndex) {
      // the caller may be external and wouldn't supply a siteIndex
      // so we make sure that we start at zero if it wasn't supplied
      siteIndex = siteIndex || 0;

      // return a promise that will try the different torrent sites and ultimately
      // 1. resolve with one(!) torrent if one is found
      // 2. reject if none was found and all sites have been tried
      return Q.fcall(function () {
        // trying the "current" torrent site
        return that.tryTorrentSite(that.allSites[siteIndex++], searchString,
          season, episode, torrentSort, maxTorrentsPerEpisode)
          .fail(function () {
            // torrent search failed
            // check whether we have more sites to try
            if (siteIndex === that.allSites.length) {
              // no more sites, reject
              log.info("Couldn't find torrent so far and have no more sites to try, aborting...");
              throw new Error('Failed to fetch torrent data from all known sites');
            }
            // we have more sites to try, do so recursively
            // resolve the current promise because we don't know yet whether we'll find torrents
            // (rejecting means we couldn't find any torrents)
            log.info('Failed fetching torrent data from site, trying next one...');
            return that.findTorrents(searchString, season, episode, torrentSort,
              maxTorrentsPerEpisode, siteIndex);
          });
      });
    };


  /**
   * Tries finding and parsing torrents on the specified torrent site.
   * NOTE: This function shouldn't be called publicly.
   *
   * @param {Parser} torrentSite - Contains the torrent site base URL and parses the response data.
   * @param {String} searchString - Additional search string.
   * @param {Number} season - Season of the torrent to look for.
   * @param {Number} episode - Episode of the torrent to look for.
   * @param {String} torrentSort - Torrent sorting method.
   * @param {Number} maxTorrentsPerEpisode - Maximum number of torrents to return.
   *
   * @returns {Promise} Promise that resolves to an array containing all found torrents.
   */
  this.tryTorrentSite = function(torrentSite, searchString,
    season, episode, torrentSort, maxTorrentsPerEpisode) {
      var url = encodeURI(torrentSite.url + searchString);

      log.info('Checking torrent site (URL %s)', url);

      return Q.Promise(function (resolve, reject) {
        exec('wget -nv -O- ' + url, function (err, stdout) {
          // ignore stderr, it's fine if wget/the current torrent site failed
          if (err) {
            // (we're not really interested in why wget failed)
            log.debug('Torrent request on %s failed', torrentSite.url);
            return reject(err);
          }

          resolve(stdout);
        });
      })
        .then(data => torrentSite.parseTorrentData(data, season, episode))
        .then(torrents => that.selectTorrents(torrents, torrentSort, maxTorrentsPerEpisode));
    };


  /**
   * Selects torrents based on the provided criteria.
   * NOTE: This function shouldn't be called publicly.
   *
   * @param {Array} torrents - Array of torrents.
   * @param {String} torrentSort - Torrent sorting method.
   * @param {Number} maxTorrentsPerEpisode - Maximum number of torrents to return.
   *
   * @returns {Array} Array of selected torrents.
   */
  this.selectTorrents = function (torrents, torrentSort, maxTorrentsPerEpisode) {
    if (!torrents || !torrents.length) {
      log.debug('No torrents to select');
      return [];
    }

    // select the torrents to return: sort + slice
    var initialTorrentCount = torrents.length;
    torrents.sort(function (a, b) { return compareTorrents(a, b, torrentSort); });
    torrents = torrents.slice(0, maxTorrentsPerEpisode);

    if (initialTorrentCount !== torrents.length) {
      log.debug('Selecting the %d %s out of %d torrents to return',
        torrents.length, torrentSort, initialTorrentCount);
    } else {
      log.debug('Selecting all %d (<= %d) torrents to return',
        torrents.length, maxTorrentsPerEpisode);
    }

    // return newly-found torrent
    return torrents;
  };

  log.info('TorrentSiteManager created');
};

