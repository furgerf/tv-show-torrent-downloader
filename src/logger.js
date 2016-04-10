'use strict';

var bunyan = require('bunyan'),

    config = require('./config'),

    streams =
    [
      {
        name: 'stdout',
        level: config.stdoutLoglevel,
        streams: process.stdout
      }
    ];

if (config.writeLogfile) {
  streams.push(
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
  streams.push(
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
  src: !config.productionEnvironment, // don't use src logging in production (slow)
  serializers: bunyan.stdSerializers,
  streams: streams
});

