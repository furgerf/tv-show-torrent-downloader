'use strict';

/* jshint -W040 */

var mongoose = require('mongoose'),
  Q = require('q'),

  utils = require('./../common/utils');

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
}),
  Subscription;

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
subscriptionSchema.statics.ensureConnected = function () {
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
};

/**
 * Initializes the database connection. This must be called before any other database functionality
 * is used, even if no real database access is requested.
 *
 * Throws an exception if no log is provided or if it was already initialized before.
 *
 * @param {Bunyan.Log} log - Logger instance.
 * @param {Object} databaseConfiguration - Database configuration object. Specify falsy (leave un-
 *                                         defined) if no database connection should be established.
 * @param {String} databaseConfiguration.host - Host of the database instance.
 * @param {Number} databaseConfiguration.port - Port of the database instance.
 */
subscriptionSchema.statics.initialize = function (log, databaseConfiguration) {
  if (this.isInitialized) {
    throw new Error('Subscription is already initialized!');
  }

  if (!log) {
    throw new Error('Cannot initialize Subscription without log!');
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
      if (mongoose.collection) {
        mongoose.collection.close(function () {
          log.info('Application is terminating: closing MongoDB connection');
          process.exit(0);
        });
      }
    });
  } else {
    this.log.warn('NOT using real database!');
  }

  this.isInitialized = true;
  this.log.info('Subscription initialized');
};

/**
 * Finds one subscription that match the given name.
 *
 * @param {String} subscriptionName - Name of the subscription to find.
 *
 * @returns {Subscription} Subscription that was found in the database, or null if not found.
 */
subscriptionSchema.statics.findSubscriptionByName = function (subscriptionName) {
  return this.ensureConnected()
    .then(() => this.findOne({name: subscriptionName}));
};

/**
 * Finds all subscriptions.
 *
 * @param {Number} limit - Optional. Maximum number of subscriptions to retrieve, defaults to return
 *                         all subscription without limit.
 * @param {Number} offset - Optional. Number of documents to skip, defaults to 0.
 *
 * @returns {Array} Array of all subscriptions that were retrieved from the database.
 */
subscriptionSchema.statics.findAllSubscriptions = function (limit, offset) {
  return this.ensureConnected()
    .then(() => limit
      ? this.find().skip(offset || 0).limit(limit)
      : this.find().skip(offset || 0));
};


/**
 * Gets a version of the subscription that can be returned to the requestee. Only returns certain
 * fields (which could also be renamed).
 *
 * @returns {Object} Returnable version of the subscription.
 */
subscriptionSchema.methods.getReturnable = function () {
  return {
    name: this.name,
    searchParameters: this.searchParameters,
    lastSeason: this.lastSeason,
    lastEpisode: this.lastEpisode,
    creationTime: this.creationTime === undefined ? null : this.creationTime,
    lastModifiedTime: this.lastModifiedTime === undefined ? null : this.lastModifiedTime,
    lastDownloadTime: this.lastDownloadTime === undefined ? null : this.lastDownloadTime,
    lastUpdateCheckTime: this.lastUpdateCheckTime === undefined ? null : this.lastUpdateCheckTime
  };
};

/**
 * Updates the last update check time to now and saves the subscription.
 */
subscriptionSchema.methods.updateLastUpdateCheckTime = function () {
  return Subscription.ensureConnected()
    .then(() => {
      this.lastUpdateCheckTime = new Date();
    })
    .then(() => {
      this.save()
    });
};

/**
 * Updates the last download time to now and saves the subscription.
 */
subscriptionSchema.methods.updateLastDownloadTime = function () {
  return Subscription.ensureConnected()
    .then(() => {
      this.lastDownloadTime = new Date();
    })
    .then(() => {
      this.save()
    });
};

/**
 * Checks whether the provided new season/episode would be a valid update to a new season for the
 * current subscription.
 *
 * @param {Number} newSeason - Potential new "current" season of the subscription.
 * @param {Number} newEpisode - Potential new "current" episode  of the subscription.
 *
 * @returns True if the season update is valid, false otherwise.
 */
subscriptionSchema.methods.isValidUpdateToNewSeason = function (newSeason, newEpisode) {
  return newSeason === this.lastSeason + 1 && newEpisode === 1;
};

/**
 * Checks whether the provided new season/episode would be a valid update to a new episode of the
 * same season for the current subscription.
 *
 * @param {Number} newSeason - Potential new "current" season of the subscription.
 * @param {Number} newEpisode - Potential new "current" episode  of the subscription.
 *
 * @returns True if the episode update is valid, false otherwise.
 */
subscriptionSchema.methods.isValidUpdateInSameSeason = function (newSeason, newEpisode) {
  return newSeason === this.lastSeason &&
    (newEpisode === this.lastEpisode || newEpisode === this.lastEpisode + 1);
};

/**
 * Updates the last downloaded season/episode of the subscription, making
 * thorough checks to ensure only valid updates are accepted.
 *
 * @param {Number} season - Potential new "current" season of the subscription.
 * @param {Number} episode - Potential new "current" episode  of the subscription.
 *
 * @returns {Boolean} True if the new season/episode was accepted.
 */
subscriptionSchema.methods.updateLastEpisode = function (season, episode) {
  if (typeof season !== 'number' || typeof episode !== 'number') {
    return false;
  }

  if (this.isValidUpdateToNewSeason(season, episode)) {
    Subscription.log.debug('Updating last episode of subscription %s from %s to %s',
      this.name, utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
      utils.formatEpisodeNumber(season, episode));

    this.lastSeason = season;
    this.lastEpisode = episode;

    return true;
  }

  if (this.isValidUpdateInSameSeason(season, episode)) {
    Subscription.log.debug('Updating last episode of subscription %s from %s to %s', this.name,
      utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
      utils.formatEpisodeNumber(this.lastSeason, episode));

    this.lastEpisode = episode;

    return true;
  }

  Subscription.log.warn('Attempting invalid season/episode update of subscription %s from %s to %s',
    this.name, utils.formatEpisodeNumber(this.lastSeason, this.lastEpisode),
    utils.formatEpisodeNumber(season, episode));

  return false;
};

/**
 * Determines whether the supplied `season` and `episode` refer to the same or next episode of the
 * subscription. The next episode of the subscription may be from the current or also from the next
 * season.
 *
 * @param {Number} season - Season number to check.
 * @param {Number} episode - Episode number to check.
 *
 * @returns {Boolean} True if the season/episode is the same or next episode of the subscription.
 */
subscriptionSchema.methods.isSameOrNextEpisode = function (season, episode) {
  return (
    // same season and same or next episode
    (season === this.lastSeason &&
      (episode === this.lastEpisode || episode === this.lastEpisode + 1))
      // *OR* first episode of next season
      || (season === this.lastSeason + 1 && (episode === 0 || episode === 1)));
};

/**
 * Pre-save action for subscriptions. Sets last modified and, if necessary, creation date as well
 * as some other required fields that might be unassigned from the subscription creation.
 */
subscriptionSchema.pre('save', function preSaveAction (next) {
  // remember `this` for access in the promise callback
  var that = this;

  return Subscription.ensureConnected()
    .then(function () {
      Subscription.log.debug('Running pre-save action for subscription "%s"', that.name);

      var currentDate = new Date();
      that.lastModifiedTime = currentDate;

      // if creationTime doesn't exist, add it
      if (!that.creationTime) {
        that.creationTime = currentDate;
      }

      that.searchParameters = that.searchParameters || '';

      that.lastSeason = that.lastSeason || 1;
      that.lastEpisode = that.lastEpisode || 0;

      Subscription.log.info('done with pre-save');
    })
    .then(next);
});

// create model
Subscription = mongoose.model('Subscription', subscriptionSchema);

exports.model = Subscription;

exports.createNew = function (data) {
  return new Subscription(data);
};

exports.initialize = subscriptionSchema.statics.initialize.bind(Subscription);

exports.findSubscriptionByName =
  subscriptionSchema.statics.findSubscriptionByName.bind(Subscription);

exports.findAllSubscriptions = subscriptionSchema.statics.findAllSubscriptions.bind(Subscription);

/* jshint +W040 */

