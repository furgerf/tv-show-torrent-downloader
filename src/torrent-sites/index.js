'use strict';

/**
 * This file must know all torrent-parsing-sites. Each torrent-parsing-site must export a
 * class named 'Parser' which contains the field 'url' and the function 'parseTorrentData'.
 */

var pirateBay = require('./piratebay'),

    exec = require('child_process').exec,
    log = require('./../logger').log.child({component: 'torrent-sites'}),

    pirateBayMn = new pirateBay.Parser('mn'),
    pirateBaySe = new pirateBay.Parser('se'),
    allSites = [
      pirateBaySe,
      pirateBayMn,
    ],
    lastSuccessfulSite; // TODO: implement behavior to first try the last successful site

function tryTorrentSite(torrentSite, searchString) {
  var url = encodeURI(torrentSite.url + searchString);

  log.debug('Checking whether %s contains any torrents', url);

  return new Promise(function (resolve, reject) {
    exec('wget -nv -O- ' + url, function (err, stdout, stderr) {
      if (err) {
        if (log) {
          log.error(err);
        } else {
          console.log(err);
        }

        return reject(err);
      }

      if (stderr) {
        if (log) {
          log.warn('Wget stderr: %s', stderr);
        } else {
          console.log('Wget stderr: %s', stderr);
        }
      }

      var torrents = torrentSite.parseTorrentData(stdout),

      // select one (or several?) of the torrents to download
      // at the moment, select the largest one
      maxSize = Math.max.apply(Math, torrents.map(function (torrent) { return torrent.size; })),
      torrent = torrents.filter(function (t) { return t.size === maxSize; })[0];
      // TODO: Move torrent selection to caller

      log.debug('URL "%s" contains %d torrents', url, torrents.length);

      if (torrent) {
        resolve(torrent);
      } else {
        reject();
      }
    });
  });
}

exports.findTorrent = function (searchString, siteIndex) {
  // the caller may be external and wouldn't supply a siteIndex
  // so we make sure that we start at zero if it wasn't supplied
  siteIndex = siteIndex || 0;

  // return a promise that will try the different torrent sites and ultimately
  // 1. resolve with one(!) torrent if one is found
  // 2. reject if none was found and all sites have been tried
  return new Promise(function (resolve, reject) {
    // trying the "current" torrent site
    tryTorrentSite(allSites[siteIndex++], searchString)
      .then (function (torrent) {
        // found torrents, resolve
        log.info('Found a torrent, not trying further torrent sites');
        resolve(torrent);
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
        resolve(exports.findTorrent(searchString, siteIndex));
      });
  });
};


