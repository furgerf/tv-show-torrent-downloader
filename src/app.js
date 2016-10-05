'use strict';

// modules
var restify = require('restify'),
  join = require('path').join,
  fs = require('fs'),

  // endpoint handlers
  ReadSubscriptionHandler = require('./handlers/subscriptions/readSubscriptionHandler'),
  WriteSubscriptionHandler = require('./handlers/subscriptions/writeSubscriptionHandler'),
  FindSubscriptionUpdatesHandler =
  require('./handlers/subscriptions/findSubscriptionUpdatesHandler'),
  UpdateSubscriptionHandler = require('./handlers/subscriptions/updateSubscriptionHandler'),

  SystemStatusHandler = require('./handlers/status/systemStatusHandler'),

  TorrentSiteManager = require('./torrent-sites/torrentSiteManager'),

  // misc variables
  connectionCount = 0,
  requestStarts = {},
  root = (function (){
    var path = __dirname.split('/');
    path.pop();
    return join(path.join('/'), 'public');
  })();

/*
global.rootRequire = function(name) {
    return require(__dirname + '/' + name);
};
*/

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
    var duration = new Date().getTime() - requestStarts[req.id()].getTime(),
      routeName = route ? route.name : '<unknown route>';
    delete requestStarts[req.id()];

    req.log.warn({res: res}, 'Finished handling request to %s in %d ms', routeName, duration);
  });

  // exception hook
  server.on('uncaughtException', function (req, res, route, error) {
    var routeName = route ? route.name : '<unknown route>';
    req.log.error(error, 'Uncaught exception while accessing %s', routeName);
    res.send(new restify.InternalServerError('%s (%s)', error.name || '', error.message || error));
  });

  // declare handlers: rather than directly mapping requests to the handler functions,
  // they're mapped to a function that calls the app's respective Handler object's handler function
  // this has two consequences: the handlers can be changed from the outside (eg in tests) and
  // the requests handler functions have access to the handler object's context
  // subscriptions
  // retrieve all/specific subscription info
  server.get(/^\/subscriptions\/?$/,
    (req, res, next) => this.readSubscriptionHandler.getAllSubscriptions(req, res, next));
  server.get(/^\/subscriptions\/([a-zA-Z0-9%]+)\/?$/,
    (req, res, next) => this.readSubscriptionHandler.getSubscriptionByName(req, res, next));

  // add/update/delete subscription
  server.post(/^\/subscriptions\/?$/,
    (req, res, next) => this.writeSubscriptionHandler.addSubscription(req, res, next));
  server.post(/^\/subscriptions\/([a-zA-Z0-9%]+)\/?$/,
    (req, res, next) => this.writeSubscriptionHandler.updateSubscription(req, res, next));
  server.del(/^\/subscriptions\/([a-zA-Z0-9%]+)\/?$/,
    (req, res, next) => this.writeSubscriptionHandler.deleteSubscription(req, res, next));

  // check all/specific subscription for update
  server.put(/^\/subscriptions\/find\/?$/, (req, res, next) =>
    this.findSubscriptionUpdatesHandler.checkAllSubscriptionsForUpdates(req, res, next));
  server.put(/^\/subscriptions\/([a-zA-Z0-9%]+)\/find\/?$/, (req, res, next) =>
    this.findSubscriptionUpdatesHandler.checkSubscriptionForUpdates(req, res, next));

  // update specific subscription with torrent
  server.put(/^\/subscriptions\/([a-zA-Z0-9%]+)\/update\/?$/, (req, res, next) =>
    this.updateSubscriptionHandler.updateSubscriptionWithTorrent(req, res, next));

  // system status
  server.get(/^\/status\/system\/disk\/?$/,
    (req, res, next) => this.systemStatusHandler.getSystemDiskUsage(req, res, next));

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
  var torrentSiteManager = new TorrentSiteManager(log.child({component: 'TorrentSiteManager'}));

  this.readSubscriptionHandler =
    new ReadSubscriptionHandler(log.child({component: 'ReadSubscriptionHandler'}));
  this.writeSubscriptionHandler =
    new WriteSubscriptionHandler(log.child({component: 'WriteSubscriptionHandler'}));
  this.findSubscriptionUpdatesHandler =
    new FindSubscriptionUpdatesHandler(torrentSiteManager,
      log.child({component: 'FindSubscriptionUpdatesHandler'}));
  this.updateSubscriptionHandler =
    new UpdateSubscriptionHandler(log.child({component: 'UpdateSubscriptionHandler'}));
  this.systemStatusHandler =
    new SystemStatusHandler(log.child({component: 'SystemStatusHandler'}));

  log.info('App created with configuration', config);

  this.config = config;

  this.server = getServer.call(this, log, config.serveStaticFiles);

  this.listen = function (callback) {
    return this.server.listen(config.api.port, config.api.host, callback);
  };

  this.close = function (callback) {
    return this.server.close(callback);
  };
}

exports.App = App;

