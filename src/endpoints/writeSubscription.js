'use strict';

var restify = require('restify'),

  utils = require('./../utils'),

  Subscription = require('./../database/subscription').Subscription;


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

function updateFields(subscription, data, log) {
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

  return subscription.save();
}

exports.updateSubscription = function (req, res, next) {
  var data = JSON.parse(req.body),  //req.body, //
    subscriptionName = decodeURIComponent(req.params[0]),
    subscription;

  // retrieve subscription
  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
    }

    // no sub with the requested name found
    if (subscriptions.length === 0) {
      utils.sendOkResponse(res, 'No subscription with name "' + subscriptionName
          + '" found to update', {}, 'http://' + req.headers.host + req.url);
      res.end();
      return next();
    }

    subscription = subscriptions[0];

    new Promise(function (resolve) {
      if (data.name === undefined) {
        updateFields(subscription, data, req.log)
          .then(function () {
            resolve();
          });
      } else {
        Subscription.find({name: data.name}, function (err, subs) {
          if (err) {
            req.log.error(err);
            return next(new restify.InternalServerError('Error while retrieving subscriptions.'));
          }

          // there already exists a subscription with the name, abort
          if (subs.length > 0) {
            utils.sendOkResponse(res, 'There already exists a subscription with the new name"' +
                data.name + '", aborting update.', {}, 'http://' + req.headers.host + req.url);
            res.end();
            return next();
          }

          updateFields(subscription, data, req.log)
            .then(function () {
              resolve();
            });
        });
      }
    })
      .then(function () {
        utils.sendOkResponse(res, 'Subscription updated', subscription.getReturnable(),
            'http://' + req.headers.host + req.url);
        res.end();
        return next();
      });
  });
};


exports.deleteSubscription = function (req, res, next) {
  var subscriptionName = decodeURIComponent(req.params[0]);

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

