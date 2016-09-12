'use strict';

// modules
var restify = require('restify'),
  join = require('path').join,
  fs = require('fs'),

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
  })();

process.title = 'tv-show-api';

function getServer(log, serveStaticFiles) {
  // set up server
  var server = restify.createServer({
    name: 'TV show downloader REST server',
    log: log
  });

  // hooks for connection logging and allowing CORS
  server.pre(function (req, res, next) {
    req.log.warn({req: req}, 'New connection (%d)', connectionCount++);

    requestStarts[req.id()] = new Date();

    res.header("Access-Control-Allow-Origin", "*");

    next();
  });

  // add some generic handlers
  server.use([
    restify.bodyParser(),
    restify.authorizationParser(),
    restify.queryParser(),
    restify.requestLogger()
    ]);

  // request handling cleanup
  server.on('after', function (req, res, route) {
    var duration = new Date().getTime() - requestStarts[req.id()].getTime();
    delete requestStarts[req.id()];

    req.log.warn({res: res}, 'Finished handling request to %s in %d ms', (route ? route.name : '<unknown route>'), duration);
  });

  // exception hook
  server.on('uncaughtException', function (req, res, route, error) {
    req.log.error(error, 'Uncaught exception while accessing %s', (route ? route.name : '<unknown route>'));
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

  // serve static files if not in production
  if (serveStaticFiles) {
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
  }

  return server;
}

function App(config, log) {
  log.info('App created with configuration', config);

  this.config = config;

  this.server = getServer(log, config.serveStaticFiles);

  this.listen = function (callback) {
    this.server.listen(config.api.port, config.api.host, callback);
  };

  this.close = function (callback) {
    return this.server.close(callback);
  };
}

exports.App = App;

