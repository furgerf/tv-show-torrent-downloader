'use strict';

var exec = require('child_process').exec,

  restify = require('restify'),

  utils = require('./../../common/utils');

/**
 * Parses a line of output generated by the `df` command.
 *
 * @param {String} data - Line generated by `df`.
 *
 * @returns {Object} Object with `mountPoint`, `spaceUsed`, and `spaceAvailable` properties, with
 *                   the unit of the latter two being bytes.
 */
function parseDiskInformation(data) {
  try {
    var split = data.replace(/\s+/g, ' ').split(' ');
    return split.length <= 5 ? null : {
      mountPoint: split.slice(5).join(' '),
      spaceUsed: split[2],
      spaceAvailable: split[3]
    };
  } catch (err) {
    // we're not really interested in the error...
    return null;
  }
}

/**
 * Handles reqests to GET /status/system/disk.
 */
function getSystemDiskUsage(req, res, next) {
  exec('df -x tmpfs -x devtmpfs | tail -n +2', function (err, stdout, stderr) {
    if (err || stderr) {
      req.log.error("Couldn't read disk usage (err: %s, stderr: %s)", err, stderr);
      return next(new restify.InternalServerError('Error while running native command.'));
    }

    var data = stdout.split('\n').map(parseDiskInformation).filter(disk => disk);

    utils.sendOkResponse('Information about ' + data.length + ' disks retrieved',
        data, res, next, 'http://' + req.headers.host + req.url);
  });
}

/**
 * Creates an instance of SystemStatusHandler.
 *
 * @constructor
 *
 * @param {Bunyan.Log} log - Logger instance.
 */
function SystemStatusHandler(log) {
  this.log = log;
  this.getSystemDiskUsage = getSystemDiskUsage;

  this.log.info('SystemStatusHandler created');
}

exports.SystemStatusHandler = SystemStatusHandler;

