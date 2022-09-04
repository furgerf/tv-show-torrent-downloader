'use strict';

var git = require('git-rev-sync'),

  utils = require('./../../common/utils');

function getNpmVersion() {
  return process.env.npm_package_version; // jshint ignore: line
}

function getGitRevision() {
  return git.long();
}

/**
 * Handles requests to GET /status/version.
 */
function getVersion(req, res, next) {
  var npmVersion = getNpmVersion(),
    gitRevision = getGitRevision(),
    data = {
      version: npmVersion,
      revision: gitRevision
    };

  utils.sendOkResponse('Server version retrieved successfully', data,
    res, next, 'http://' + req.headers.host + req.url);
}

/**
 * Creates an instance of VersionHandler.
 *
 * @constructor
 *
 * @param {Bunyan.Log} log - Logger instance.
 */
function VersionHandler(log) {
  this.log = log;
  this.getVersion = getVersion;

  this.log.info('VersionHandler created');
}

module.exports = VersionHandler;

