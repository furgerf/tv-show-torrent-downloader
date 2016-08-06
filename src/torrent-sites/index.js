'use strict';

/**
 * This file must know all torrent-parsing-sites. Each torrent-parsing-site must export a
 * class named 'Parser' which contains the field 'url' and the function 'parseTorrentData'.
 */

var Q = require('q'),
  exec = require('child_process').exec,

  pirateBay = require('./piratebay'),

  log = require('./../common/logger').log.child({component: 'torrent-sites'}),

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

  throw new Error('Unknown sort: ' + sort);
}

function tryTorrentSite(torrentSite, searchString,
    season, episode, torrentSort, maxTorrentsPerEpisode) {
  var url = encodeURI(torrentSite.url + searchString);

  log.info('Checking torrent site (URL %s)', url);

  return Q.Promise(function (resolve, reject) {
    exec('wget -nv -O- ' + url, function (err, stdout) {
      // ignore stderr, it's fine if wget/the current torrent site failed
      if (err) {
        // (we're not really interested in why wget failed)
        log.debug('Torrent request on %s failed', torrentSite.url);
        reject(err);
        return;
      }

      resolve(stdout);
    });
  })
  .then(function (siteData) {
    var torrents = torrentSite.parseTorrentData(siteData, season, episode);

    log.debug('URL "%s" contains %d torrents', url, torrents.length);

    if (!torrents || !torrents.length) {
      return [];
    }

    // select the torrents to return: sort + slice
    torrents.sort(function (a, b) { return compareTorrents(a, b, torrentSort); });
    torrents = torrents.slice(0, maxTorrentsPerEpisode);

    log.debug('Selected the %d %s torrents to return', torrents.length, torrentSort);

    // return newly-found torrent
    return torrents;
  });
}

// NOTE: siteIndex must STAY the last parameter!!
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
          log.info("Couldn't find torrent so far and have no more sites to try, aborting...");
          throw new Error('Failed to fetch torrent data from all known sites');
        }
        // we have more sites to try, do so recursively
        // resolve the current promise because we don't know yet whether we'll find torrents
        // (rejecting means we couldn't find any torrents)
        log.info("Failed fetching torrent data from site, trying next one...");
        return findTorrents(searchString, season, episode, torrentSort,
              maxTorrentsPerEpisode, siteIndex);
      });
  });
}

exports.findTorrents = findTorrents;

