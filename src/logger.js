'use strict';

var bunyan = require('bunyan'),
    fs = require('fs'),

    config = require('./config'),

    logStreams = [{
    name: 'stdout',
    level: 'debug',
    stream: process.stdout
  }];

if (config.writeLogfile) {
  console.log('Logging to main logfile');
  if (!fs.existsSync(config.logDirectory)){
    fs.mkdirSync(config.logDirectory);
  }

  logStreams.push(
  {
    name: 'main log',
    level: 'info',
    path: config.logDirectory + '/tv-show-downloader.log',
    type: 'rotating-file',
    period: '1w',
    count: 5
  });
}

if (config.writeErrorlogfile) {
  console.log('Writing to error logfile');
  if (!fs.existsSync(config.logDirectory)){
    fs.mkdirSync(config.logDirectory);
  }

  logStreams.push(
  {
    name: 'error log',
    level: 'error',
    path: config.logDirectory + '/tv-show-downloader_error.log',
    type: 'rotating-file',
    period: '1w',
    count: 5
  });
}

exports.log = bunyan.createLogger({
  name: 'tvshowdownloader',
  src: !config.productionEnvironment, // dont use src logging in production (slow)
  serializers: bunyan.stdSerializers,
  streams: logStreams
});

