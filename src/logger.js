'use strict';

var bunyan = require('bunyan');

exports.log = bunyan.createLogger({
  name: 'tvshowdownloader',
  src: true, // DONT USE SRC LOGGING IN PRODUCTION (SLOW)
  serializers: bunyan.stdSerializers,
  streams: [{
    name: 'stdout',
    level: 'debug',
    stream: process.stdout
  },
  /*
  {
    // TODO: use log rotation: https://github.com/trentm/node-bunyan#stream-type-rotating-file
    name: 'main log',
    level: 'info',
    path: 'smrest.log'
  },
  {
    name: 'error log',
    level: 'error',
    path: 'error.log'
  }
  */
    ]
});

