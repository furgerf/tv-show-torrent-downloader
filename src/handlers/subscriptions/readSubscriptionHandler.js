"use strict";

var restify = require("restify"),

  utils = require("./../../common/utils"),
  database = require("./../../database/subscription");


function ReadSubscriptionHandler(log) {
  this.log = log;
  this.getSubscriptionByName = getSubscriptionByName;
  this.getAllSubscriptions = getAllSubscriptions;

  this.log.info('ReadSubscriptionHandler created');
}


/**
 * Handles reqests to GET /subscriptions/:subscriptionName.
 */
function getSubscriptionByName (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]);

  // retrieve subscriptions
  database.findSubscriptionByName(subscriptionName)
    .then(function (subscription) {
      if (!subscription) {
        return next(
            new restify.BadRequestError("No subscription with name '" + subscriptionName + "'."));
      }

      // sub with requested name found, return returnable
      utils.sendOkResponse("Subscription with name '" + subscriptionName + "' retrieved.",
          subscription.getReturnable(), res, next, "http://" + req.headers.host + req.url);
    });
}

/**
 * Handles reqests to GET /subscriptions.
 */
function getAllSubscriptions (req, res, next) {
  var offset = parseInt(req.params.offset, 10) || 0,
    limit = parseInt(req.params.limit, 10) || 20;

  // retrieve subs
  database.findAllSubscriptions(limit, offset)
    .then(function (subscriptions) {
      // return returnable of all retrieved subscriptions
      utils.sendOkResponse(subscriptions.length + " subscription(s) retrieved",
          subscriptions.map(sub => sub.getReturnable()),
          res, next, "http://" + req.headers.host + req.url);
      next();
    });
}

exports.ReadSubscriptionHandler = ReadSubscriptionHandler;

