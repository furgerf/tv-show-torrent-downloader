'use strict';

var bunyan = require('bunyan'),
  fs = require('fs');

/**
 * Makes sure that the desired logging directory exists.
 *
 * @param {String} directory - Directory where the logs should be written to.
 */
function ensureLogDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

exports.createLogger = function(logConfig) {
  var logStreams,
    logger,
    logMessages = [];

  logConfig = logConfig || {};

  logStreams = [{
    name: 'stdout',
    level: logConfig.stdoutLoglevel || 'info',
    stream: process.stdout
  }];

  if (logConfig.writeLogfile) {
    ensureLogDirectoryExists(logConfig.logDirectory);
    logStreams.push({
      name: 'main log',
      level: 'debug',
      path: logConfig.logDirectory + '/tv-show-downloader.log',
      type: 'rotating-file',
      period: '1w',
      count: 5
    });
    logMessages.push('Logging to main logfile');
  }

  if (logConfig.writeErrorlogfile) {
    ensureLogDirectoryExists(logConfig.logDirectory);
    logStreams.push({
      name: 'error log',
      level: 'error',
      path: logConfig.logDirectory + '/tv-show-downloader_error.log',
      type: 'rotating-file',
      period: '1w',
      count: 5
    });
    logMessages.push('Logging to error logfile');
  }

  logger = bunyan.createLogger({
    name: 'tvshowdownloader',
    src: logConfig.sourceLogging,
    serializers: bunyan.stdSerializers,
    streams: logStreams
  });

  logMessages.forEach(function (message) {
    logger.info(message);
  });

  return logger;
};

