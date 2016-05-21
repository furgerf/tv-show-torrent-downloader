'use strict';

var log = require('./../logger').log.child({component: 'subscription'}),
  mongoose = require('mongoose'),

  utils = require('./../utils');

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
function getReturnableSubscription() {
  var returnable = JSON.parse(JSON.stringify(this));

  // remove MongoDB id
  delete returnable._id;

  // remove Mongoose document version number
  delete returnable.__v;

  return returnable;
}
subscriptionSchema.methods.getReturnable = getReturnableSubscription;

/**
 * Updates the last episode update check time to now and saves the subscription.
 */
function updateLastEpisodeUpdateCheck() {
  this.lastEpisodeUpdateCheck = new Date();
  this.save();
}
subscriptionSchema.methods.updateLastEpisodeUpdateCheck = updateLastEpisodeUpdateCheck;

/**
 * Update the last season update check time to now and saves the subscription.
 */
function updateLastSeasonUpdateCheck() {
  this.lastSeasonUpdateCheck = new Date();
  this.save();
}
subscriptionSchema.methods.updateLastSeasonUpdateCheck = updateLastSeasonUpdateCheck;

/**
 * Updates the last downloaded season/episode of the subscription, making
 * thorough checks to ensure only valid updates are accepted. Whether the
 * season/episode update was accepted is returned as a boolean.
 */
function updateLastEpisode(newSeason, newEpisode) {
  var season = typeof newSeason === 'number' ? newSeason : parseInt(newSeason, 10),
    episode = typeof newEpisode === 'number' ? newEpisode : parseInt(newEpisode, 10);

  if (Number.isNaN(season) || Number.isNaN(episode)) {
    return false;
  }

  if (season > this.lastSeason) {
    if (episode === 1) {
      log.debug('Updating last episode of subscription %s from %s to %s',
          this.name, utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
          utils.formatEpisodeNumber(season, episode));
      this.lastSeason = season;
      this.lastEpisode = episode;
    } else {
      log.warn('Attempting to change season of subscription %s and assign episode %d - aborting',
          this.name, episode);
      return false;
    }
  } else if (season === this.lastSeason) {
    if (episode === this.lastEpisode + 1) {
      log.debug('Updating last episode of subscription %s from %s to %s', this.name,
          utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
          utils.formatEpisodeNumber(this.lastSeason, episode));
      this.lastEpisode = episode;
    } else {
      log.warn('Attempting to set last episode of subscription %s from %d to %d - aborting',
          this.name, this.lastEpisode, episode);
      return false;
    }
  } else {
    log.warn('Attempting to decrease last season of subscription %s from %d to %d - aborting',
        this.name, this.lastSeason, season);
    return false;
  }
  return true;
}
subscriptionSchema.methods.updateLastEpisode = updateLastEpisode;

/**
 * Pre-save action for subscriptions. Sets last modified
 * and, if necessary, creation date.
 */
function preSaveAction(next) {
  log.debug('Running pre-save action for subsciption "%s"', this.name);

  var currentDate = new Date();
  this.lastModified = currentDate;

  // if creationTime doesn't exist, add it
  if (!this.creationTime) {
    this.creationTime = currentDate;
  }

  this.searchParameters = this.searchParameters || '';

  this.lastSeason = this.lastSeason || 1;
  this.lastEpisode = this.lastEpisode || 0;

  next();
}
subscriptionSchema.pre('save', preSaveAction);

// create and export model
exports.Subscription = mongoose.model('Subscription', subscriptionSchema);

