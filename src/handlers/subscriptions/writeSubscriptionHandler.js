'use strict';

var restify = require('restify'),
  Q = require('q'),

  utils = require('./../../common/utils'),

  Subscription = require('./../../database/subscription');


/**
 * Creates a new subscription from the provided data. Only the fields that are allowed to be set
 * by the user are assigned and not specified but mandatory fields are set to default values.
 *
 * @param {Object} data - Data with which to create the subscription.
 *
 * @returns {Subscription} The newly-created subscription.
 */
function createNewSubscriptionFromData (data) {
  // make sure we have a name
  if (!data || !data.name) {
    return null;
  }

  // we only let the user assign some fields...
  var newSubscriptionData = {
    name: data.name,
    searchParameters: data.searchParameters,
    lastSeason: data.lastSeason || 1,
    lastEpisode: data.lastEpisode || 0
  };

  return new Subscription(newSubscriptionData);
}

/**
 * Handles requests to POST /subscriptions.
 */
function addSubscription (req, res, next) {
  var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  if (!body || !body.name) {
    return next(new restify.BadRequestError('Provide the name of the tv show to subscribe to.'));
  }

  // TODO: Return 201 instead of 200
  Q.fcall(createNewSubscriptionFromData(body).save)
    .then(doc => utils.sendOkResponse('New subscription created', doc.getReturnable(),
          res, next, 'http://' + req.headers.host + req.url))
    .fail(error =>
        next(new restify.InternalServerError('Error while saving new subscription: ' + error)));
}

/**
 * Handles requests to POST /subscriptions/:subscriptionName.
 */
function updateSubscription (req, res, next) {
  var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body,
    subscriptionName = decodeURIComponent(req.params[0]),
    that = this;

  body.name = body.name || subscriptionName;

  // TODO: Return 201 instead of 200 if a new subscription was created
  // retrieve existing subscription that would be updated
  Subscription.findSubscriptionByName(subscriptionName)
    // if the subscription doesn't exist yet, create a new one
    .then(subscription => subscription ? subscription : createNewSubscriptionFromData(body))
      // update the fields and save
    .then(subscription => that.updateFields(subscription, body, req.log).save())
    .then(subscription => utils.sendOkResponse('Subscription updated',
          subscription.getReturnable(), res, next, 'http://' + req.headers.host + req.url))
    .fail(error =>
        next(new restify.InternalServerError('Error while updating subscription: ' + error)));
}

/**
 * Handles requests to DELETE /subscriptions/:subscriptionName.
 */
function deleteSubscription (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]);

  Subscription.findSubscriptionByName(subscriptionName)
    .then(subscription => subscription
        ? subscription
        : next(new restify.BadRequestError("No subscription named '" + subscriptionName + "'.")))
    .then(subscription => subscription.remove())
    .then(() => utils.sendOkResponse('Removed subscription with name "' +
          subscriptionName + '".', {}, res, next, 'http://' + req.headers.host + req.url))
    .fail(error =>
        next(new restify.InternalServerError('Error while removing subscription: ' + error)));
}


/**
 * Creates an instance of WriteSubscriptionHandler.
 *
 * @constructor
 *
 * @param {Bunyan.Log} log - Logger instance.
 */
function WriteSubscriptionHandler(log) {
  this.log = log;
  this.addSubscription = addSubscription;
  this.updateSubscription = updateSubscription;
  this.deleteSubscription = deleteSubscription;

  this.log.info('WriteSubscriptionHandler created');
}


/**
 * Updates the allowed fields of the subscription with the provided data. Only the fields that are
 * allowed to be modified by the user and are actually specified are updated.
 * NOTE: This function shouldn't be called publicly.
 *
 * @param {Subscription} subscription - Subscription to update.
 * @param {Object} data - Data which updates the subscription.
 * @param {Bunyan.Log} - Logger instance.
 *
 * @returns {Subscription} The updated subscription.
 */
WriteSubscriptionHandler.prototype.updateFields = function (subscription, data) {
  if (!subscription || !data) {
    this.log.warn('Aborting subscription update because subscription %s or data %s are not valid',
      subscription, data);
    return subscription;
  }

  this.log.info('Updating subscription %s with:', subscription, data);

  if (data.name !== undefined) {
    subscription.name = data.name;
  }
  if (data.searchParameters !== undefined) {
    subscription.searchParameters = data.searchParameters;
  }
  if (data.lastSeason !== undefined) {
    subscription.lastSeason = data.lastSeason;
  }
  if (data.lastEpisode !== undefined) {
    subscription.lastEpisode = data.lastEpisode;
  }

  return subscription;
};

module.exports = WriteSubscriptionHandler;

