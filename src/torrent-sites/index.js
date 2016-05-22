'use strict';

/**
 * This file must know all torrent-parsing-sites. Each torrent-parsing-site must export a
 * class named 'Parser' which contains the field 'url' and the function 'parseTorrentData'.
 */

var pirateBay = require('./piratebay'),

    exec = require('child_process').exec,
    log = require('./../logger').log.child({component: 'torrent-sites'}),

    pirateBayMn = new pirateBay.Parser('thepiratebay.mn'),
    pirateBaySe = new pirateBay.Parser('thepiratebay.se'),
    pirateBayPe = new pirateBay.Parser('pirateproxy.pe'),
    pirateBayAhoy = new pirateBay.Parser('ahoy.one'),
    pirateBayPatatje = new pirateBay.Parser('tpb.patatje.eu'),
    allSites = [
      pirateBayPatatje,
      pirateBayAhoy,
      pirateBayPe,
      pirateBaySe,
      pirateBayMn,
    ],
    lastSuccessfulSite; // TODO: implement behavior to first try the last successful site

function compareTorrents(t1, t2, sort) {
  if (sort === 'largest')
    return t1.size < t2.size;
  if (sort === 'smallest')
    return t1.size > t2.size;
  if (sort === 'newest')
    return t1.uploadDate < t2.uploadDate;
  if (sort === 'oldest')
    return t1.uploadDate > t2.uploadDate;

  throw new Error('Unknown sort: ' + sort);
}

function tryTorrentSite(torrentSite, searchString, season, episode, torrentSort, maxTorrentsPerEpisode) {
  var url = encodeURI(torrentSite.url + searchString);

  log.info('Checking torrent site %s (URL %s)', torrentSite.url, url);

  return new Promise(function (resolve, reject) {
    exec('wget -nv -O- ' + url, function (err, stdout, stderr) {
      // ignore stderr, it's fine if wget/the current torrent site failed
      if (err) {
        // (we're not really interested in why wget failed)
        log.debug('Torrent request on %s failed', torrentSite.url);
        reject(err);
        return;
      }

      var torrents = torrentSite.parseTorrentData(stdout, season, episode);

      log.debug('URL "%s" contains %d torrents', url, torrents.length);

      // select the torrents to return: sort + slice
      torrents.sort(function (a, b) { return compareTorrents(a, b, torrentSort); });
      torrents = torrents.slice(0, maxTorrentsPerEpisode);

      log.debug('Selected the %d %s torrents to return', torrents.length, torrentSort);

      // resolve with newly-found torrent (which may be undefined)
      resolve(torrents);
    });
  });
}

// NOTE: siteIndex must STAY the last parameter!!
exports.findTorrents = function (searchString, season, episode, torrentSort, maxTorrentsPerEpisode, siteIndex) {
  // the caller may be external and wouldn't supply a siteIndex
  // so we make sure that we start at zero if it wasn't supplied
  siteIndex = siteIndex || 0;

  // return a promise that will try the different torrent sites and ultimately
  // 1. resolve with one(!) torrent if one is found
  // 2. reject if none was found and all sites have been tried
  return new Promise(function (resolve, reject) {
    // trying the "current" torrent site
    tryTorrentSite(allSites[siteIndex++], searchString, season, episode, torrentSort, maxTorrentsPerEpisode)
      .then (function (torrents) {
        // successfully tried torrent site, resolve with result
        resolve(torrents);
      })
      .catch (function (err) {
        // no torrents were found
        // check whether we have more sites to try
        if (siteIndex == allSites.length) {
          // no more sites, reject
          log.info("Couldn't find torrent so far and have no more sites to try, aborting...");
          reject();
          return;
        }
        // we have more sites to try, do so recursively
        // resolve the current promise because we don't know yet whether we'll find torrents
        // (rejecting means we couldn't find any torrents)
        log.info("Couldn't find torrent on previous site, trying next one...");
        resolve(exports.findTorrents(searchString, season, episode, siteIndex));
      });
  });
};

