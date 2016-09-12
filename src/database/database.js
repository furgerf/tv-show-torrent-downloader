'use strict';

var mongoose = require('mongoose');

function connect(databaseConfig) {
  var databaseAddress = 'mongodb://' + databaseConfig.host+ ':' + databaseConfig.port + '/tv-shows';
  // TODO: Find out how to check and, if required, establish a connection before
  // each database interaction
  mongoose.connect(databaseAddress);
};

exports.connect = connect;

