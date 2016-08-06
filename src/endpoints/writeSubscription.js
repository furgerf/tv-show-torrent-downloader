'use strict';

var restify = require('restify'),

  utils = require('./../common/utils'),

  Q = require('q'),
  database = require('./../database/subscription'),
  Subscription = database.Subscription;


function updateFields (subscription, data, log) {
  log && log.info('Updating subscription %s with:', subscription, data);

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
}

function createNewSubscriptionFromData (data) {
  // we only let the user assign some fields...
  var newSubscriptionData = {
    name: data.name,
    searchParameters: data.searchParameters,
    lastSeason: data.lastSeason || 1,
    lastEpisode: data.lastEpisode || 0
  };
  return new Subscription(newSubscriptionData);
}


function addSubscription (req, res, next) {
  var data = JSON.parse(req.body);

  if (!data.name) {
    return next(new restify.BadRequestError('Provide the name of the tv show to subscribe to.'));
  }

  Q.fcall(createNewSubscriptionFromData(data).save)
    .then(doc => utils.sendOkResponse('New subscription created', doc.getReturnable(),
          res, next, 'http://' + req.headers.host + req.url))
    .fail(error =>
        next(new restify.InternalServerError('Error while saving new subscription: ' + error)));
}

function updateSubscription (req, res, next) {
  var data = JSON.parse(req.body),  //req.body,
    subscriptionName = decodeURIComponent(req.params[0]);

  data.name = data.name || subscriptionName;

  // retrieve existing subscription that would be updated
  database.findSubscriptionByName(subscriptionName)
    // if the subscription doesn't exist yet, create a new one
    .then(subscription => subscription ? subscription : createNewSubscriptionFromData(data))
      // update the fields and save
    .then(subscription => updateFields(subscription, data, req.log).save())
    .then(subscription => utils.sendOkResponse('Subscription updated',
          subscription.getReturnable(), res, next, 'http://' + req.headers.host + req.url))
    .fail(error =>
        next(new restify.InternalServerError('Error while updating subscription: ' + error)));
}

function deleteSubscription (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]);

  database.findSubscriptionByName(subscriptionName)
    .then(subscription => subscription
        ? subscription
        : next(new restify.BadRequestError("No subscription named '" + subscriptionName + "'.")))
    .then(subscription => subscription.remove())
    .then(() => utils.sendOkResponse('Removed subscription with name "' +
          subscriptionName + '".', {}, res, next, 'http://' + req.headers.host + req.url))
    .fail(error =>
        next(new restify.InternalServerError('Error while removing subscription: ' + error)));
}

exports.addSubscription = addSubscription;
exports.updateSubscription = updateSubscription;
exports.deleteSubscription = deleteSubscription;

