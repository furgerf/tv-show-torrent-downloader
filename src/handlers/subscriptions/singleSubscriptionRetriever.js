'use strict';

const subscriptionUrlRegex = /^\/subscriptions\/([a-zA-Z0-9%]+)\/?/;

var Subscription = require("./../../database/subscription");

// jshint unused: false
exports.retrieve = function (req, res, next) {
  var matches = req.url.match(subscriptionUrlRegex),
    subscriptionName = matches ? decodeURIComponent(matches[1]) : null;

  if (!subscriptionName) {
    return next();
  }

  Subscription.findSubscriptionByName(subscriptionName)
    .then(function (subscription) {
      req.log.info('Retrieved subscription "%s" from database', subscriptionName);
      req.subscription = subscription;
    })
    .fail(function (err) {
      req.log.error(err);
    })
    .fin(next);
};

