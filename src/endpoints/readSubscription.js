'use strict';

var restify = require('restify'),

  utils = require('./../utils'),

  Subscription = require('./../database/subscription').Subscription;


exports.getSubscription = function (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]);

  // retrieve subscriptions
  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    var result;

    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    // no sub with the requested name found
    if (subscriptions.length === 0) {
      utils.sendOkResponse(res, 'No subscription with name "' + subscriptionName + '" found',
          {}, 'http://' + req.headers.host + req.url);
      res.end();
      return next();
    }

    // sub with requested name found, return returnable
    result = subscriptions[0].getReturnable();
    utils.sendOkResponse(res, 'Subscription with name "' + subscriptionName + '" retrieved',
        result, 'http://' + req.headers.host + req.url);
    res.end();
    return next();
  });
};


exports.getAllSubscriptions = function (req, res, next) {
  var offset = parseInt(req.params.offset, 10) || 0,
    limit = parseInt(req.params.limit, 10) || 20;

  // retrieve subs
  Subscription.find().skip(offset).limit(limit).exec(function (err, subscriptions) {
    var result;
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    // extract returnables from database results
    result = subscriptions.map(function (sub) { return sub.getReturnable(); });

    utils.sendOkResponse(res, result.length + ' subscription(s) retrieved', result,
        'http://' + req.headers.host + req.url);
    res.end();
    return next();
  });
};

