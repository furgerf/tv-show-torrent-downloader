'use strict';

var //log = require('./../common/logger').log.child({component: 'database'}),
  mongoose = require('mongoose'),

  config = require('./../common/config'),

  databaseUrl = config.database.host + ':' + config.database.port + '/',
  databaseName = 'tv-shows',
  databaseAddress = 'mongodb://' + databaseUrl + databaseName;

exports.connect = function () {
  // TODO: Find out how to check and, if required, establish a connection before
  // each database interaction
  mongoose.connect(databaseAddress);
};

