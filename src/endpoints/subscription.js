'use strict';

/*global Promise*/

var request = require('request'),
  restify = require('restify'),
  JSZip = require('jszip'),

  config = require('./../config'),
  database = require('./../database'),
  utils = require('./../utils'),

  Subscription = database.Subscription;

exports.getSubscription = function (req, res, next) {
  var subscriptionName = req.params[0];

  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    var result;
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Something went wrong when accessing the database.'));
    }

    if (subscriptions.length === 0) {
      utils.sendOkResponse(res, 'No subscription with name "' + subscriptionName + '" found', {}, 'http://' + req.headers.host + req.url);
      res.end();
      return next();
    }

    result = subscriptions[0].getReturnable();

    utils.sendOkResponse(res, 'Subscription with name "' + subscriptionName + '" retrieved', result, 'http://' + req.headers.host + req.url);
    res.end();
    return next();
  });
};

exports.deleteSubscription = function (req, res, next) {
  var subscriptionName = req.params[0];

  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    var deleteCount = 0;

    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Something went wrong when accessing the database.'));
    }

    if (subscriptions.length === 0) {
      utils.sendOkResponse(res, 'No subscription with name "' + subscriptionName + '" found to delete', {}, 'http://' + req.headers.host + req.url);
      res.end();
      return next();
    }

    Promise.all(subscriptions.map(function (subscription) {
      return subscription.remove(function (err) {
        if (err) {
          req.log.error(err);
          return next(new restify.InternalServerError('Something went wrong when accessing the database.'));
        }

        req.log.warn('Removed subscription with name "%s"', subscription.name);
        deleteCount++;
      });
    }))
      .then(function () {
        utils.sendOkResponse(res, 'Removed ' + deleteCount + ' subscriptions with name "' + subscriptionName + '".', {}, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      });
  });
};

exports.getSubscriptions = function (req, res, next) {
  var offset = parseInt(req.params.offset, 10) || 0,
    limit = parseInt(req.params.limit, 10) || 20;

  Subscription.find().skip(offset).limit(limit).exec(function (err, subscriptions) {
    var result;
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Something went wrong when accessing the database.'));
    }

    result = subscriptions.map(function (sub) { return sub.getReturnable(); });

    utils.sendOkResponse(res, result.length + ' subscriptions retrieved', result, 'http://' + req.headers.host + req.url);
    res.end();
    return next();
  });
};

exports.addSubscription = function (req, res, next) {
  var data = JSON.parse(req.body),
    newSubscriptionData,
    newSubscription;

  if (!data.name) {
    return next(new restify.BadRequestError('Please provide the name of the tv show to subscribe to.'));
  }

  // we only let the user assign some fields...
  newSubscriptionData = {
    name: data.name,
    searchParameters: data.searchParameters,
    lastSeason: data.lastSeason || 1,
    lastEpisode: data.lastEpisode || 0
  };
  newSubscription = new Subscription(newSubscriptionData);

  req.log.info('Saving new subscription:', newSubscription);
  newSubscription.save(function (err) {
    if (err) {
      throw err;
    }

    req.log.info('New subscription created');

    utils.sendOkResponse(res, 'New subscription created', newSubscription.getReturnable(), 'http://' + req.headers.host + req.url);
    res.end();
    return next();
  });
};

