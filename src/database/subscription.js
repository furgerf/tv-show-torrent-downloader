'use strict';

/* jshint -W040 */

var log = undefined, //require('./../common/logger').child({component: 'subscription'}),
  mongoose = require('mongoose'),
  Q = require('q'),

  utils = require('./../common/utils');

/**
 * Mongoose schema definition for the subscription of a tv show.
 */
var subscriptionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  searchParameters: String,
  lastSeason: Number,
  lastEpisode: Number,
  creationTime: Date,
  lastModifiedTime: Date,
  lastDownloadTime: Date,
  lastUpdateCheckTime: Date,
});

/**
 * Gets a version of the subscription that can be returned to the requestee. Only returns certain
 * fields (which could also be renamed).
 *
 * @returns {Object} Returnable version of the subscription.
 */
function getReturnableSubscription() {
  return {
    name: this.name === undefined ? null : this.name,
    searchParameters: this.searchParameters === undefined ? null : this.searchParameters,
    lastSeason: this.lastSeason === undefined ? null : this.lastSeason,
    lastEpisode: this.lastEpisode === undefined ? null : this.lastEpisode,
    creationTime: this.creationTime === undefined ? null : this.creationTime,
    lastModifiedTime: this.lastModifiedTime === undefined ? null : this.lastModifiedTime,
    lastDownloadTime: this.lastDownloadTime === undefined ? null : this.lastDownloadTime,
    lastUpdateCheckTime: this.lastUpdateCheckTime === undefined ? null : this.lastUpdateCheckTime
  };
}
subscriptionSchema.methods.getReturnable = getReturnableSubscription;

/**
 * Updates the last update check time to now and saves the subscription.
 */
function updateLastUpdateCheckTime() {
  this.lastUpdateCheckTime = new Date();
  this.save();
}
subscriptionSchema.methods.updateLastUpdateCheckTime = updateLastUpdateCheckTime;

/**
 * Updates the last download time to now and saves the subscription.
 */
function updateLastDownloadTime() {
  this.lastDownloadTime = new Date();
  this.save();
}
subscriptionSchema.methods.updateLastDownloadTime = updateLastDownloadTime;

/**
 * Updates the last downloaded season/episode of the subscription, making
 * thorough checks to ensure only valid updates are accepted.
 *
 * @param {Number} newSeason - Potential new "current" season of the subscription.
 * @param {Number} newEpisode - Potential new "current" episode  of the subscription.
 *
 * @returns {Boolean} True if the new season/episode was accepted.
 */
function updateLastEpisode(newSeason, newEpisode) {
  var season = typeof newSeason === 'number' ? newSeason : parseInt(newSeason, 10),
    episode = typeof newEpisode === 'number' ? newEpisode : parseInt(newEpisode, 10);

  if (Number.isNaN(season) || Number.isNaN(episode)) {
    return false;
  }

  if (season > this.lastSeason) {
    if (episode === 1) {
      //log.debug('Updating last episode of subscription %s from %s to %s',
          //this.name, utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
          //utils.formatEpisodeNumber(season, episode));
      this.lastSeason = season;
      this.lastEpisode = episode;
    } else {
      //log.warn('Attempting to change season of subscription %s and assign episode %d - aborting',
          //this.name, episode);
      return false;
    }
  } else if (season === this.lastSeason) {
    if (episode === this.lastEpisode + 1) {
      //log.debug('Updating last episode of subscription %s from %s to %s', this.name,
          //utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
          //utils.formatEpisodeNumber(this.lastSeason, episode));
      this.lastEpisode = episode;
    } else {
      //log.warn('Attempting to set last episode of subscription %s from %d to %d - aborting',
          //this.name, this.lastEpisode, episode);
      return false;
    }
  } else {
    //log.warn('Attempting to decrease last season of subscription %s from %d to %d - aborting',
        //this.name, this.lastSeason, season);
    return false;
  }
  return true;
}
subscriptionSchema.methods.updateLastEpisode = updateLastEpisode;

/**
 * Pre-save action for subscriptions. Sets last modified and, if necessary, creation date as well
 * as some other required fields that might be unassigned from the subscription creation.
 */
function preSaveAction(next) {
  //log.debug('Running pre-save action for subscription "%s"', this.name);

  var currentDate = new Date();
  this.lastModifiedTime = currentDate;

  // if creationTime doesn't exist, add it
  if (!this.creationTime) {
    this.creationTime = currentDate;
  }

  this.searchParameters = this.searchParameters || '';

  this.lastSeason = this.lastSeason || 1;
  this.lastEpisode = this.lastEpisode || 0;

  //log.info('about to be done with pre-save');
  next();
  //log.info('done with pre-save');
}
subscriptionSchema.pre('save', preSaveAction);

// create and export model
// TODO: avoid recompiling (else unit tests can't work)
// TODO: find out whether it is really necessary to export it
var Subscription = mongoose.model('Subscription', subscriptionSchema);

/////////////////////////////
// database access methods //
/////////////////////////////
/**
 * Finds one subscription that match the given name.
 *
 * @param {String} subscriptionName - Name of the subscription to find.
 *
 * @returns {Subscription} Subscription that was found in the database, or null if not found.
 */
function findSubscriptionByName(subscriptionName) {
  return Q.fcall(function () {
    return Subscription.findOne({name: subscriptionName});
  });
}

/**
 * Finds all subscriptions.
 *
 * @param {Number} limit - Optional. Maximum number of subscriptions to retrieve, defaults to return
 *                         all subscription without limit.
 * @param {Number} offset - Optional. Number of documents to skip, defaults to 0.
 *
 * @returns {Array} Array of all subscriptions that were retrieved from the database.
 */
function findAllSubscriptions(limit, offset) {
  return Q.fcall(function () {
    return limit
      ? Subscription.find().skip(offset || 0).limit(limit)
      : Subscription.find().skip(offset || 0);
  });
}


exports.Subscription = Subscription;

exports.findSubscriptionByName = findSubscriptionByName;
exports.findAllSubscriptions = findAllSubscriptions;

/* jshint +W040 */

