'use strict';

/* jshint -W040 */

var mongoose = require('mongoose'),
  Q = require('q'),

  utils = require('./../common/utils'),

  initializedDatabaseInstance;

mongoose.Promise = Q.Promise;

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
 * Checks whether the database is currently connected.
 *
 * @returns {Boolean} True if the database is currently connected.
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Ensures that the database is connected if necessary.
 *
 * @returns {Promise} A promise that resolves if the database is connected and rejects if
 *                    the database connection couldn't be established.
 */
function ensureConnected() {
  return Q.fcall(function () {
    if (!this.isInitialized) {
      throw new Error('Cannot establish database connection: Not initialized');
    }

    if (!this.useDatabase) {
      return;
    }

    if (isConnected()) {
      return;
    }

    return mongoose.connect(this.databaseAddress);
  }.bind(this));
}
subscriptionSchema.statics.ensureConnected = ensureConnected;

/**
 * Initializes the database connection. This must be called before any other database functionality
 * is used, even if no real database access is requested.
 *
 * @param {Bunyan.Log} log - Logger instance.
 * @param {Object} databaseConfiguration - Database configuration object. Specify falsy (leave un-
 *                                         defined) if no database connection should be established.
 * @param {String} databaseConfiguration.host - Host of the database instance.
 * @param {Number} databaseConfiguration.port - Port of the database instance.
 */
function initialize(log, databaseConfiguration) {
  if (!log) {
    console.log('ERROR: Cannot initialize Subscription without log, aborting!');
    return;
  }

  this.log = log;

  // we may not want to connect to a real database - check whether we received
  // db config, if yes, then we do want to connect to a database
  this.useDatabase = !!databaseConfiguration;

  if (this.useDatabase) {
    var databaseAddress =
      'mongodb://' + databaseConfiguration.host + ':' + databaseConfiguration.port + '/tv-shows';

    this.databaseAddress = databaseAddress;
    this.log.info('Using real database at %s', this.databaseAddress);

    mongoose.connection.on('connected', function () {
      log.info('Connected to MongoDB at %s', databaseAddress);
    });
    mongoose.connection.on('error', function (err) {
      log.error('MongoDB error: %s', err);
    });
    mongoose.connection.on('disconnected', function () {
      log.warn('Connection to MongoDB lost', databaseAddress);
    });
    process.on('SIGINT', function () {
      mongoose.collection.close(function () {
        log.info('Application is terminating: closing MongoDB connection');
        process.exit(0);
      });
    });
  } else {
    this.log.warn('NOT using real database!');
  }

  this.isInitialized = true;
  initializedDatabaseInstance = this;
  this.log.info('Subscription initialized');
}
subscriptionSchema.statics.initialize = initialize;

/**
 * Finds one subscription that match the given name.
 *
 * @param {String} subscriptionName - Name of the subscription to find.
 *
 * @returns {Subscription} Subscription that was found in the database, or null if not found.
 */
function findSubscriptionByName(subscriptionName) {
  return this.ensureConnected()
    .then(() => this.findOne({name: subscriptionName}));
}
subscriptionSchema.statics.findSubscriptionByName = findSubscriptionByName;

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
  return this.ensureConnected()
    .then(() => limit
      ? this.find().skip(offset || 0).limit(limit)
      : this.find().skip(offset || 0));
}
subscriptionSchema.statics.findAllSubscriptions = findAllSubscriptions;


/**
 * Gets a version of the subscription that can be returned to the requestee. Only returns certain
 * fields (which could also be renamed).
 *
 * @returns {Object} Returnable version of the subscription.
 */
function getReturnable() {
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
subscriptionSchema.methods.getReturnable = getReturnable;

/**
 * Updates the last update check time to now and saves the subscription.
 * TODO: the document is saved asynchronously, have to do something to manage that...
 */
function updateLastUpdateCheckTime() {
  return this.ensureConnected()
    .then(function () {
      this.lastUpdateCheckTime = new Date();
      this.save();
    });
}
subscriptionSchema.methods.updateLastUpdateCheckTime = updateLastUpdateCheckTime;

/**
 * Updates the last download time to now and saves the subscription.
 * TODO: the document is saved asynchronously, have to do something to manage that...
 */
function updateLastDownloadTime() {
  return this.ensureConnected()
    .then(function () {
      this.lastDownloadTime = new Date();
      this.save();
    });
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

  if (season === this.lastSeason + 1) {
    if (episode === 1) {
      this.log.debug('Updating last episode of subscription %s from %s to %s',
          this.name, utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
          utils.formatEpisodeNumber(season, episode));
      this.lastSeason = season;
      this.lastEpisode = episode;
    } else {
      this.log.warn('Attempted to change season of subscription %s and assign episode %d: aborting',
          this.name, episode);
      return false;
    }
  } else if (season === this.lastSeason) {
    if (episode === this.lastEpisode + 1) {
      this.log.debug('Updating last episode of subscription %s from %s to %s', this.name,
          utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
          utils.formatEpisodeNumber(this.lastSeason, episode));
      this.lastEpisode = episode;
    } else {
      this.log.warn('Attempting to set last episode of subscription %s from %d to %d - aborting',
          this.name, this.lastEpisode, episode);
      return false;
    }
  } else {
    this.log.warn('Attempting to set invalid season of subscription %s from %d to %d - aborting',
        this.name, this.lastSeason, season);
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
  // remember `this` for access in the promise callback
  // also, we have no database context so we fall back to the initialized database instance
  var that = this,
    database = initializedDatabaseInstance;

  // TODO: Verify it's working...
  return database.ensureConnected()
    .then(function () {
      database.log.debug('Running pre-save action for subscription "%s"', that.name);

      var currentDate = new Date();
      that.lastModifiedTime = currentDate;

      // if creationTime doesn't exist, add it
      if (!that.creationTime) {
        that.creationTime = currentDate;
      }

      that.searchParameters = that.searchParameters || '';

      that.lastSeason = that.lastSeason || 1;
      that.lastEpisode = that.lastEpisode || 0;

      database.log.info('about to be done with pre-save');
      next();
      database.log.info('done with pre-save');
    });
}
subscriptionSchema.pre('save', preSaveAction);

// create and export model
module.exports = mongoose.model('Subscription', subscriptionSchema);

/* jshint +W040 */

