'use strict';

/**
 * Gets a string representing a number, making sure it has exactly 2 digits.
 *
 * @param {Number} num - Number which should be formatted as a two-digit number.
 *
 * @returns {String} String containing the two digits.
 */
function twoDigitNumber(num) {
  var n = typeof num === 'number' ? num : parseInt(num, 10);
  return Number.isNaN(n) ? undefined : ('0' + n).slice(-2);
}

/**
 * Formats season/episode to the common tv show format "SxxEyy".
 *
 * @param {Number} season - Number of the season.
 * @param {Number} episode - Number of the episode.
 *
 * @returns {String} Formatted episode.
 */
exports.formatEpisodeNumber = function (season, episode) {
  var formattedSeason = twoDigitNumber(season),
    formattedEpisode = twoDigitNumber(episode);

  return formattedSeason && formattedEpisode
    ? 'S' + formattedSeason + 'E' + formattedEpisode
    : undefined;
};

/**
 * Converts a formatted file size to bytes.
 * Eg. 2 KiB would be converted to 2048.
 *
 * @param {Number} num - Number of the file size.
 * @param {String} unit - Unit of the file size.
 *
 * @returns {Number} Size converted to bytes.
 */
exports.fileSizeToBytes = function (num, unit) {
  const factors = {
    KiB: 1024,
    MiB: Math.pow(1024, 2),
    GiB: Math.pow(1024, 3),
    KB: 1000,
    MB: Math.pow(1000, 2),
    GB: Math.pow(1000, 3)
  };

  var n = typeof num === 'number' ? num : parseInt(num, 10);

  if (Number.isNaN(n) || !factors[unit]) {
    return undefined;
  }

  return n * factors[unit];
};

/**
 * Sends a response to the request which was handled successfully and calls next() to
 * show that the handler is done handling the request.
 *
 * @param {String} message - Message that describes how the request was handled
 * @param {Object} data - Response data
 * @param {Response} res - Response which should be sent
 * @param {Function} next - Function to pass request to next handler
 * @param {String} url - Optional. URL which was accessed in the request
 * @param {String} etag - Optional. ETAG header
 * @param {Date} lastModified - Optional. Date of last modification
 */
exports.sendOkResponse = function (message, data, res, next, url, etag, lastModified) {
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
  next();
};

