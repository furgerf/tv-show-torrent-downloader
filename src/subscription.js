var request = require('request'),
    restify = require('restify'),
    JSZip = require('jszip');

    config = require('./config'),
    database = require('./database'),
    utils = require('./utils'),

    Subscription = database.Subscription;

    //awful.util.spawn("firefox -new-tab http://thepiratebay.mn/search/" .. word)

exports.getSubscription = function (req, res, next) {
  var subscriptionName = req.params[0];

  req.log.warn(subscriptionName);
  Subscription.find({name: subscriptionName}, function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Something went wrong when accessing the database.'));
    }

    if (subscriptions.length === 0) {
      utils.sendOkResponse(res, 'No subscription with name "' + subscriptionName + '" found', {}, 'http://' + req.headers.host + req.url);
      res.end();
      return next();
    }

    var result = subscriptions[0].getReturnable();

    utils.sendOkResponse(res, 'Subscription with name "' + subscriptionName + '" retrieved', result, 'http://' + req.headers.host + req.url);
    res.end();
    return next();
  })
};

exports.getSubscriptions = function (req, res, next) {
  var offset = parseInt(req.params.offset) || 0,
  limit = parseInt(req.params.limit) || 20;

  Subscription.find().skip(offset).limit(limit).exec(function (err, subscriptions) {
    if (err) {
      req.log.error(err);
      return next(new restify.InternalServerError('Something went wrong when accessing the database.'));
    }

    var result = subscriptions.map(function (sub) { return sub.getReturnable(); });

    utils.sendOkResponse(res, result.length + ' subscriptions retrieved', result, 'http://' + req.headers.host + req.url);
    res.end();
    return next();
  })
};

exports.addSubscription = function (req, res, next) {
  var data = JSON.parse(req.body);
  if (!data.name) return next(new restify.BadRequestError('Please provide the name of the tv show to subscribe to.'));

  // we only let the user assign some fields...
  var newSubscriptionData =
  {
    name: data.name,
    searchParameters: data.searchParameters,
    lastSeason: data.lastSeason || 1,
    lastEpisode: data.lastEpisode || 0
  },
  newSubscription = new Subscription(newSubscriptionData);

  req.log.info('Saving new subscription:', newSubscription);
  newSubscription.save(function(err) {
    if (err) throw err;

    req.log.info('New subscription created');

    utils.sendOkResponse(res, 'New subscription created', newSubscription.getReturnable(), 'http://' + req.headers.host + req.url);
    res.end();
    return next();
  });
};

