'use strict';

var utils = require('./../config');

exports.parseSize = function (str) {
  var data = str.match(/(\d+(?:\.\d+)?).*\b(.{2}B).*/);
  return utils.fileSizeToBytes(parseInt(data[1], 10), data[2]);
};

exports.parseDate = function (str) {
  var data = str.match(/(\d{2})-(\d{2}).*;(\d{2}):(\d{2})/),
    date = new Date(new Date().getFullYear(), parseInt(data[1], 10) - 1, parseInt(data[2], 10), parseInt(data[3], 10), parseInt(data[4], 10));

  if (date > new Date()) {
    date.setFullYear(date.getFullYear() - 1);
  }

  return date;
};

