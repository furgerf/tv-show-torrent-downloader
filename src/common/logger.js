'use strict';

var bunyan = require('bunyan'),
  fs = require('fs');

function createLogger(logConfig) {
  var logStreams, logger;

  logConfig = logConfig || {};

  logStreams = [{
    name: 'stdout',
    level: logConfig.stdoutLoglevel || 'info',
    stream: process.stdout
  }];

  if (logConfig.writeLogfile) {
    if (!fs.existsSync(logConfig.logDirectory)) {
      fs.mkdirSync(logConfig.logDirectory);
    }

    logStreams.push(
      {
        name: 'main log',
        level: 'info',
        path: logConfig.logDirectory + '/tv-show-downloader.log',
        type: 'rotating-file',
        period: '1w',
        count: 5
      }
    );
  }

  if (logConfig.writeErrorlogfile) {
    if (!fs.existsSync(logConfig.logDirectory)) {
      fs.mkdirSync(logConfig.logDirectory);
    }

    logStreams.push(
      {
        name: 'error log',
        level: 'error',
        path: logConfig.logDirectory + '/tv-show-downloader_error.log',
        type: 'rotating-file',
        period: '1w',
        count: 5
      }
    );
  }

  logger = bunyan.createLogger({
    name: 'tvshowdownloader',
    src: logConfig.sourceLogging,
    serializers: bunyan.stdSerializers,
    streams: logStreams
  });

  if (logConfig.writeLogfile) {
    logger.info('Logging to main logfile');
  }
  if (logConfig.writeErrorlogfile) {
    logger.info('Writing to error logfile');
  }

  return logger;
}

exports.createLogger = createLogger;

