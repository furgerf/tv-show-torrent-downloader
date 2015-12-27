'use strict';

var log = require('./logger').log.child({component: 'database'}),
  mongoose = require('mongoose'),

  config = require('./config'),
  utils = require('./utils'),

  databaseUrl = config.database.host + ':' + config.database.port + '/',
  databaseName = 'tv-shows',
  databaseAddress = 'mongodb://' + databaseUrl + databaseName;

/**
 * Mongoose schema definition for the subscription of a tv show.
 */
var subscriptionSchema = new mongoose.Schema({
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
 * Updates the last downloaded season/episode of the subscription, making
 * thorough checks to ensure only valid updates are accepted. Whether the
 * season/episode update was accepted is returned as a boolean.
 */
subscriptionSchema.methods.updateLastEpisode = function (season, episode) {
  if (season > this.lastSeason) {
    if (episode === 1) {
      log.debug('Updating last episode of subscription %s from %s to %s', this.name, utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode), utils.formatEpisodeNumber(season, episode));
      this.lastSeason = season;
      this.lastEpisode = episode;
    } else {
      log.warn('Attempting to increase last season of subscription %s and assign episode %d - aborting', this.name, episode);
      return false;
    }
  } else if (season === this.lastSeason) {
    if (episode === this.lastEpisode + 1) {
      log.debug('Updating last episode of subscription %s from %s to %s', this.name, utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode), utils.formatEpisodeNumber(this.lastSeason, episode));
      this.lastEpisode = episode;
    } else {
      log.warn('Attempting to set last episode of subscription %s from %d to %d - aborting', this.name, this.lastEpisode, episode);
      return false;
    }
  } else {
    log.warn('Attempting to decrease last season of subscription %s from %d to %d - aborting', this.name, this.lastSeason, season);
    return false;
  }
  return true;
};

/**
 * Pre-save action for subscriptions. Sets last modified
 * and, if necessary, creation date.
 */
subscriptionSchema.pre('save', function (next) {
  log.debug('Running pre-save action for subsciption "%s"', this.name);

  var currentDate = new Date();
  this.lastModified = currentDate;

  // if creationTime doesn't exist, add it
  if (!this.creationTime) {
    this.creationTime = currentDate;
  }

  next();
});

// create and export model
exports.Subscription = mongoose.model('Subscription', subscriptionSchema);

// TODO: Find out how to check and, if required, establish a connection before
// each database interaction
mongoose.connect(databaseAddress);

