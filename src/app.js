'use strict';

// modules
var restify = require('restify'),
    join = require('path').join,
    fs = require('fs'),

    // common files
    logger = require('./common/logger'),

    // endpoint handlers
    readSubscription = require('./endpoints/readSubscription'),
    writeSubscription = require('./endpoints/writeSubscription'),
    findSubscriptionUpdates = require('./endpoints/findSubscriptionUpdates'),
    updateSubscription = require('./endpoints/updateSubscription'),

    systemStatus = require('./endpoints/systemStatus'),

    // misc variables
    connectionCount = 0,
    requestStarts = {},
    root = (function (){
      var path = __dirname.split('/');
      path.pop();
      return join(path.join('/'), 'public');
    })(),
    server;

process.title = 'tv-show-api';

// set up server
server = restify.createServer({
  name: 'TV show downloader REST server',
  log: logger.log.child({component: 'endpoint'}),
});
server.use(restify.bodyParser());
server.use(restify.authorizationParser());
server.use(restify.queryParser());
server.use(restify.requestLogger());

// hooks for connection logging and allowing CORS
server.pre(function (req, res, next) {
  req.log.warn({req: req}, 'New connection (%d)', connectionCount++);

  requestStarts[req.id()] = new Date();

  // TODO: don't allow CORS in production
  res.header("Access-Control-Allow-Origin", "*");

  next();
});
server.on('after', function (req, res, route) {
  var duration = new Date().getTime() - requestStarts[req.id()].getTime();
  delete requestStarts[req.id()];

  req.log.warn({res: res}, 'Finished handling request to %s in %d ms', route.name, duration);
});
server.on('uncaughtException', function (req, res, route, error) {
  req.log.error(error, 'Uncaught exception while accessing %s', route.name);
  res.send(new restify.InternalServerError('%s (%s)', error.name || '', error.message || error));
});

// subscriptions
// retrieve all/specific subscription info
server.get(/^\/subscriptions\/?$/, readSubscription.getAllSubscriptions);
server.get(/^\/subscriptions\/([a-zA-Z0-9%]+)\/?$/, readSubscription.getSubscriptionByName);

// add/update/delete subscription
server.post(/^\/subscriptions\/?$/, writeSubscription.addSubscription);
server.post(/^\/subscriptions\/([a-zA-Z0-9%]+)\/?$/, writeSubscription.updateSubscription);
server.del(/^\/subscriptions\/([a-zA-Z0-9%]+)\/?$/, writeSubscription.deleteSubscription);

// check all/specific subscription for update
server.put(/^\/subscriptions\/find\/?$/,
    findSubscriptionUpdates.checkAllSubscriptionsForUpdates);
server.put(/^\/subscriptions\/([a-zA-Z0-9%]+)\/find\/?$/,
    findSubscriptionUpdates.checkSubscriptionForUpdates);

// update specific subscription with torrent
server.put(/^\/subscriptions\/([a-zA-Z0-9%]+)\/update\/?$/,
    updateSubscription.updateSubscriptionWithTorrent);

// system status
server.get(/^\/status\/system\/disk\/?$/, systemStatus.getSystemDiskUsage);

// root
server.get(/^\/$/, function (req, res, next) {
  req.log.debug('Accessing root');
  res.redirect('/index.html', next);
});

// TODO: don't serve static files in production
// evertything else... try public FS
server.get(/^\/([a-zA-Z0-9_\/\.~-]*)/, function (req, res, next) {
  var path = join(root, req.params[0]),
  stream = fs.createReadStream(path);

  stream.on('error', function (err) {
    req.log.error('Error while trying to access %s: %s', path, err);
    return next(new restify.NotFoundError());
  });

  req.log.debug('Accessing path %s', path);
  stream.pipe(res);
});

exports.listen = function () {
  return server.listen.apply(server, arguments);
  /*
     (port || config.api.port, host || config.api.host, function() {
     console.log(server);
     log.warn('TV show downloader API running on %s:%s ',
         server.address().address, server.address().port);
     config.api.port = server.address().port;

  // connect to database
  database.connect();
  });
  */
};

exports.close = function (callback) {
  return server.close(callback);
};

if ('--start' in process.argv) {
  console.log(42);
}

