"use strict";

var restify = require("restify"),

  utils = require("./../common/utils"),

  database = require("./../database/subscription");

function getSubscriptionByName (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]);

  // retrieve subscriptions
  database.findSubscriptionByName(subscriptionName)
    .then(function (subscription) {
      if (!subscription) {
        return next(new restify.BadRequestError("No subscription with name '" + subscriptionName + "'."));
      }

      // sub with requested name found, return returnable
      utils.sendOkResponse(res, "Subscription with name '" + subscriptionName + "' retrieved.",
          subscription.getReturnable(), "http://" + req.headers.host + req.url);
    });
}

function getAllSubscriptions (req, res, next) {
  var offset = parseInt(req.params.offset, 10) || 0,
    limit = parseInt(req.params.limit, 10) || 20;

  // retrieve subs
  database.findAllSubscriptions()
    .then(function (subscriptions) {
      // return returnable of all retrieved subscriptions
      utils.sendOkResponse(res, subscriptions.length + " subscription(s) retrieved",
          subscriptions.map(sub => sub.getReturnable()), "http://" + req.headers.host + req.url);
    });
}

exports.getSubscriptionByName = getSubscriptionByName;
exports.getAllSubscriptions = getAllSubscriptions;

