'use strict';

/**
 * Returns a string representing a number, making sure it has exactly 2 digits.
 * @param num Number which should be formatted as a two-digit number
 */
function twoDigitNumber (num) {
  return ('0' + (num || '0')).slice(-2);
}



/**
 * Returs the common tv show episode number format "SxxEyy".
 * @param season Number of the season
 * @param episode Number of the episode
 */
exports.formatEpisodeNumber = function (season, episode) {
  return 'S' + twoDigitNumber(season) + 'E' + twoDigitNumber(episode);
};

/**
 * Converts a formatted file size to bytes.
 * Eg. 2 KiB would be converted to 2048.
 * @param number Number of the file size
 * @param unit Unit of the file size
 */
exports.fileSizeToBytes = function (number, unit) {
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
};

/**
 * Sends a response to the request which was handled successfully.
 * @param res Response which should be sent
 * @param message Message that describes how the request was handled
 * @param data Response data
 * @param url Optional. URL which was accessed in the request
 * @param etag Optional. ETAG header
 * @param lastModified Optional. Date of last modification
 */
exports.sendOkResponse = function (res, message, data, url, etag, lastModified) {
  // assign always-same fields
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');

  // assign optional fields (if provided)
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

