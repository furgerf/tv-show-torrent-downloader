'use strict';

/**
 * This file must know all torrent-parsing-sites. Each torrent-parsing-site must export a
 * class named 'Parser' which contains the field 'url' and the function 'parseTorrentData'.
 */

var Q = require('q'),
  exec = require('child_process').exec,

  pirateBay = require('./piratebay'),

  log = undefined, //require('./../common/logger').child({component: 'torrent-sites'}),

  pirateBayMn = new pirateBay.Parser('thepiratebay.mn'),
  pirateBaySe = new pirateBay.Parser('thepiratebay.se'),
  pirateBayPe = new pirateBay.Parser('pirateproxy.pe'),
  pirateBayAhoy = new pirateBay.Parser('ahoy.one'),
  pirateBayPatatje = new pirateBay.Parser('tpb.patatje.eu'),
  invalidParser = new pirateBay.Parser('foobar'),
  allSites = [
    pirateBayPatatje,
    pirateBayAhoy,
    pirateBayPe,
    pirateBaySe,
    pirateBayMn,
    invalidParser,
  ];

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
function compareTorrents(t1, t2, sort) {
  if (sort === 'largest') {
    return t1.size < t2.size;
  }
  if (sort === 'smallest') {
    return t1.size > t2.size;
  }
  if (sort === 'newest') {
    return t1.uploadDate < t2.uploadDate;
  }
  if (sort === 'oldest') {
    return t1.uploadDate > t2.uploadDate;
  }
  if (sort === 'mostseeded') {
    return t1.seeders < t2.seeders;
  }

  throw new Error('Unknown sort: ' + sort);
}

/**
 * Tries finding and parsing torrents on the specified torrent site.
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
function tryTorrentSite(torrentSite, searchString,
    season, episode, torrentSort, maxTorrentsPerEpisode) {
  var url = encodeURI(torrentSite.url + searchString);

  //log.info('Checking torrent site (URL %s)', url);

  return Q.Promise(function (resolve, reject) {
    exec('wget -nv -O- ' + url, function (err, stdout) {
      // ignore stderr, it's fine if wget/the current torrent site failed
      if (err) {
        // (we're not really interested in why wget failed)
        //log.debug('Torrent request on %s failed', torrentSite.url);
        return reject(err);
      }

      resolve(stdout);
    });
  })
  .then(function (siteData) {
    var torrents = torrentSite.parseTorrentData(siteData, season, episode);

    //log.debug('URL "%s" contains %d torrents', url, torrents.length);

    if (!torrents || !torrents.length) {
      return [];
    }

    // select the torrents to return: sort + slice
    torrents.sort(function (a, b) { return compareTorrents(a, b, torrentSort); });
    torrents = torrents.slice(0, maxTorrentsPerEpisode);

    //log.debug('Selected the %d %s torrents to return', torrents.length, torrentSort);

    // return newly-found torrent
    return torrents;
  });
}

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
function findTorrents(searchString, season, episode,
  torrentSort, maxTorrentsPerEpisode, siteIndex) {
  // the caller may be external and wouldn't supply a siteIndex
  // so we make sure that we start at zero if it wasn't supplied
  siteIndex = siteIndex || 0;

  // return a promise that will try the different torrent sites and ultimately
  // 1. resolve with one(!) torrent if one is found
  // 2. reject if none was found and all sites have been tried
  return Q.fcall(function () {
    // trying the "current" torrent site
    return tryTorrentSite(allSites[siteIndex++], searchString,
      season, episode, torrentSort, maxTorrentsPerEpisode)
      .fail(function () {
        // torrent search failed
        // check whether we have more sites to try
        if (siteIndex === allSites.length) {
          // no more sites, reject
          //log.info("Couldn't find torrent so far and have no more sites to try, aborting...");
          throw new Error('Failed to fetch torrent data from all known sites');
        }
        // we have more sites to try, do so recursively
        // resolve the current promise because we don't know yet whether we'll find torrents
        // (rejecting means we couldn't find any torrents)
        //log.info("Failed fetching torrent data from site, trying next one...");
        return findTorrents(searchString, season, episode, torrentSort,
              maxTorrentsPerEpisode, siteIndex);
      });
  });
}

exports.findTorrents = findTorrents;

