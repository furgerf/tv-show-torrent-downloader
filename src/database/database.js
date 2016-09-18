'use strict';

var mongoose = require('mongoose');

function connect(databaseConfig, log) {
  var databaseAddress = 'mongodb://' + databaseConfig.host+ ':' + databaseConfig.port + '/tv-shows';
  // TODO: Find out how to check and, if required, establish a connection before
  // each database interaction
  mongoose.connect(databaseAddress);
  log.info('Database connected to %s', databaseAddress);
}

exports.connect = connect;

