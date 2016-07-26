'use strict';

var restify = require('restify'),

  exec = require('child_process').exec,

  utils = require('./../common/utils');


function parseDiskInformation(data) {
  try {
    var split = data.replace(/\s+/g, ' ').split(' ');
    return split.length <= 5 ? null : {
      mountPoint: split[5],
      spaceUsed: split[2],
      spaceAvailable: split[3]
    };
  } catch (err) {
    // we're not really interested in the error...
    return null;
  }
}


function getSystemDiskUsage(req, res, next) {
  exec('df -x tmpfs -x devtmpfs | tail -n +2', function (err, stdout, stderr) {
    if (err || stderr) {
      req.log.error("Couldn't read disk usage (err: %s, stderr: %s)", err, stderr);
      return new restify.InternalServerError('Error while running native command.');
    }

    var data = stdout.split('\n').map(parseDiskInformation).filter(disk => disk);

    utils.sendOkResponse(res, 'Information about ' + data.length + ' disks retrieved',
        data, 'http://' + req.headers.host + req.url);
  })
}

exports.getSystemDiskUsage = getSystemDiskUsage;

