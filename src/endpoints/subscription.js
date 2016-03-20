'use strict';

var restify = require('restify'),

  utils = require('./../utils'),

  Subscription = require('./../database/subscription').Subscription;

exports.getSubscription = function (req, res, next) {
  var subscriptionName = req.params[0];

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

exports.deleteSubscription = function (req, res, next) {
  var subscriptionName = req.params[0];

  // retrieve subscriptions
  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    var deleteCount = 0;

    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    // no sub with the requested name found
    if (subscriptions.length === 0) {
      utils.sendOkResponse(res, 'No subscription with name "' + subscriptionName
          + '" found to delete', {}, 'http://' + req.headers.host + req.url);
      res.end();
      return next();
    }

    // delete all subs that were found (should always be 1)
    Promise.all(subscriptions.map(function (subscription) {
      return subscription.remove(function (err) {
        if (err) {
          req.log.error(err);
          return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
        }

        req.log.warn('Removed subscription with name "%s"', subscription.name);
        deleteCount++;
      });
    }))
      .then(function () {
        utils.sendOkResponse(res, 'Removed ' + deleteCount + ' subscription(s) with name "'
            + subscriptionName + '".', {}, 'http://' + req.headers.host + req.url);
        res.end();
        return next();
      });
  });
};

exports.getSubscriptions = function (req, res, next) {
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

exports.addSubscription = function (req, res, next) {
  var data = req.body, //JSON.parse(req.body),
    newSubscriptionData,
    newSubscription;

  if (!data.name) {
    return next(new restify.BadRequestError('Provide the name of the tv show to subscribe to.'));
  }

  // we only let the user assign some fields...
  newSubscriptionData = {
    name: data.name,
    searchParameters: data.searchParameters,
    lastSeason: data.lastSeason || 1,
    lastEpisode: data.lastEpisode || 0
  };
  newSubscription = new Subscription(newSubscriptionData);

  req.log.debug('Saving new subscription:', newSubscription);
  newSubscription.save(function (err) {
    if (err) {
      throw err;
    }

    req.log.info('New subscription created');

    utils.sendOkResponse(res, 'New subscription created', newSubscription.getReturnable(),
        'http://' + req.headers.host + req.url);
    res.end();
    return next();
  });
};

