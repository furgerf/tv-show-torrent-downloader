'use strict';

var restify = require('restify'),

  exec = require('child_process').exec,

  utils = require('./../common/utils');


function parseDiskInformation(data) {
  try {
    var split = data.replace(/\s+/g, ' ').split(' ');
    return {
      mountPoint: split[5],
      spaceUsed: split[2],
      spaceAvailable: split[3]
    };
  } catch (err) {
    // we're not really interested in the error...
    return null;
  }
}


exports.getSystemDiskUsage = function (req, res, next) {
  exec('df -x tmpfs -x devtmpfs | tail -n +2', function (err, stdout, stderr) {
    if (err || stderr) {
      req.log.error("Couldn't read disk usage (err: %s, stderr: %s)", err, stderr);
      return new restify.InternalServerError('Error while running native command.');
    }

    var disks = stdout.trim().split('\n')
      .map(parseDiskInformation).filter(function (disk) { return disk; });

    utils.sendOkResponse(res, 'Information about ' + disks.length + ' disks retrieved',
        disks, 'http://' + req.headers.host + req.url);
    res.end();
    return next();
  });
};

