/**
 * utils.js
 * Contains various util functions.
 */

var request = require('request'),
    promise = require('promise'),
    //sha1 = require('sha1'),

    config = require('./config');

exports.sendOkResponse = function (res, message, data, url, etag, lastModified) {
  'use strict';

  // assign always-same fields
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');

  // assign fields that may also be provided
  url && res.setHeader('Location', url);
  etag && res.setHeader('ETag', etag);
  lastModified && res.setHeader('Last-Modified', lastModified);

  // send response
  res.send({
    code: 'Success',
    message: message || '',
    href: url || '<unknown>',
    data: data || {},
  });
  res.end();
};

exports.sendBinaryResponse = function (res, data) {
  'use strict';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/octetstream');
  res.send(data);
  res.end();
};

fileSizeToBytes = function (number, unit) {
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

twoDigitNumber = function (num) {
  return ('0' + num).slice(-2);
}

exports.formatEpisodeNumber = function (season, episode) {
  return 'S' + twoDigitNumber(season) + 'E' + twoDigitNumber(episode);
}

exports.parseSize = function (str) {
  var data = str.match(/(\d+(?:\.\d+)?).*\b(.{2}B).*/);
  return fileSizeToBytes(parseInt(data[1], 10), data[2]);
}

exports.parseDate = function (str) {
  var data = str.match(/(\d{2})-(\d{2}).*;(\d{2}):(\d{2})/),
      date = new Date(new Date().getFullYear(), parseInt(data[1], 10) - 1, parseInt(data[2], 10), parseInt(data[3], 10), parseInt(data[4], 10));

  if (date > new Date()) {
    date.setFullYear(date.getFullYear() - 1);
  }

  return date;
}

