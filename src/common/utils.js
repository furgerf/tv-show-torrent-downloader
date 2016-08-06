'use strict';

/**
 * Returns a string representing a number, making sure it has exactly 2 digits.
 * @param num Number which should be formatted as a two-digit number
 */
function twoDigitNumber(num) {
  var n = typeof num === 'number' ? num : parseInt(num, 10);
  return Number.isNaN(n) ? undefined : ('0' + n).slice(-2);
}



/**
 * Returs the common tv show episode number format "SxxEyy".
 * @param season Number of the season
 * @param episode Number of the episode
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
 * @param number Number of the file size
 * @param unit Unit of the file size
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
  // TODO: Pass and call next();
};

