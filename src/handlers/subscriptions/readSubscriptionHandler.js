'use strict';

var restify = require("restify"),

  utils = require("./../../common/utils"),
  Subscription = require("./../../database/subscription");

/**
 * Handles requests to GET /subscriptions/:subscriptionName.
 */
function getSubscriptionByName (req, res, next) {
  if (!req.subscription) {
    return next(new restify.BadRequestError('No subscription found with the given name.'));
  }

  // sub with requested name found, return returnable
  utils.sendOkResponse("Subscription with name '" + req.subscription.name + "' retrieved.",
    req.subscription.getReturnable(), res, next, "http://" + req.headers.host + req.url);
}

/**
 * Handles requests to GET /subscriptions.
 */
function getAllSubscriptions (req, res, next) {
  var offset = parseInt(req.params.offset, 10) || 0,
    limit = parseInt(req.params.limit, 10);

  // retrieve subs
  Subscription.findAllSubscriptions(limit, offset)
    .then(function (subscriptions) {
      // return returnable of all retrieved subscriptions
      utils.sendOkResponse(subscriptions.length + " subscription(s) retrieved",
          subscriptions.map(sub => sub.getReturnable()),
          res, next, "http://" + req.headers.host + req.url);
      next();
    });
}

/**
 * Creates an instance of ReadSubscriptionHandler.
 *
 * @constructor
 *
 * @param {Bunyan.Log} log - Logger instance.
 */
function ReadSubscriptionHandler(log) {
  this.log = log;
  this.getSubscriptionByName = getSubscriptionByName;
  this.getAllSubscriptions = getAllSubscriptions;

  this.log.info('ReadSubscriptionHandler created');
}

module.exports = ReadSubscriptionHandler;

