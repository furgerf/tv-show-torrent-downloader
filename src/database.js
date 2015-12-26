'use strict';

var log = require('./logger').log.child({component: 'database'}),
    mongoose = require('mongoose'),

    config = require('./config');

const databaseUrl = config.database.host + ':' + config.database.port + '/',
      databaseName = 'tv-shows',
      databaseAddress = 'mongodb://' + databaseUrl + databaseName;

/**
 * Mongoose schema definition for the subscription of a tv show.
 */
var subscriptionSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true },
      searchParameters: String,
      lastSeason: Number,
      lastEpisode: Number,
      creationTime: Date,
      lastModified: Date,
      lastSeasonUpdateCheck: Date,
      lastEpisodeUpdateCheck: Date
    });

/**
 * Gets a version of the subscription that can be returned
 * to the caller. This means removing and potentially also
 * renaming some fields.
 */
subscriptionSchema.methods.getReturnable = function () {
  var returnable = JSON.parse(JSON.stringify(this));

  // remove MongoDB id
  delete returnable._id;

  // remove Mongoose document version number
  delete returnable.__v;

  return returnable;
};

/**
 * Pre-save action for subscriptions. Sets last modified
 * and, if necessary, creation date.
 */
subscriptionSchema.pre('save', function(next) {
  log.debug('Running pre-save action for subsciption "%s"', this.name);

  var currentDate = new Date();
  this.lastModified = currentDate;

  // if creationTime doesn't exist, add it
  if (!this.creationTime)
    this.creationTime = currentDate;

  next();
});

// create and export model
exports.Subscription = mongoose.model('Subscription', subscriptionSchema);

// TODO: Find out how to check and, if required, establish a connection before
// each database interaction
mongoose.connect(databaseAddress);

