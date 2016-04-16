'use strict';

// modules
var restify = require('restify'),
    http = require('http'),
    join = require('path').join,
    fs = require('fs'),


    // common files
    config = require('./src/config'),
    logger = require('./src/logger'),
    database = require('./src/database/database'),

    // endpoint handlers
    readSubscription = require('./src/endpoints/readSubscription'),
    writeSubscription = require('./src/endpoints/writeSubscription'),
    findSubscriptionUpdates = require('./src/endpoints/findSubscriptionUpdates'),
    updateSubscription = require('./src/endpoints/updateSubscription'),

    // misc variables
    log = logger.log.child({component: 'server'}),
    connectionCount = 0,
    server = restify.createServer({
      name: 'TV show downloader REST server',
      log: logger.log.child({component: 'endpoint'}),
    }),
    requestStarts = {},
    root = join(__dirname, 'public');

// set up server
server.use(restify.bodyParser());
server.use(restify.authorizationParser());
server.use(restify.queryParser());
server.use(restify.requestLogger());

// hooks for connection logging and allowing CORS
server.pre(function (req, res, next) {
  req.log.warn({req: req}, 'New connection (%d)', connectionCount++);

  requestStarts[req.id()] = new Date();

  res.header("Access-Control-Allow-Origin", "*");

  next();
});
server.on('after', function (req, res, route) {
  var duration = new Date().getTime() - requestStarts[req.id()].getTime();
  delete requestStarts[req.id()];

  req.log.warn({res: res}, 'Finished handling request in %d ms', duration);
});
server.on('uncaughtException', function (req, res, route, error) {
  req.log.error(error, 'Uncaught exception');
  res.send(new restify.InternalServerError('%s (%s)', error.name || '', error.message || error));
});

// connect to database
database.connect();

// start server
server.listen(config.api.port, config.api.host, function () {
  log.warn('TV show downloader API running on %s:%s ', config.api.host, config.api.port);

  // subscriptions
  // retrieve all/specific subscription info
  server.get(/^\/subscriptions\/?$/, readSubscription.getAllSubscriptions);
  server.get(/^\/subscriptions\/([a-zA-Z0-9]+)\/?$/, readSubscription.getSubscription);

  // add/delete subscription
  server.post(/^\/subscriptions\/?$/, writeSubscription.addSubscription);
  server.del(/^\/subscriptions\/([a-zA-Z0-9]+)\/?$/, writeSubscription.deleteSubscription);

  // check all/specific subscription for update
  server.get(/^\/subscriptions\/find\/?$/, findSubscriptionUpdates.checkAllSubscriptionsForUpdates);
  server.get(/^\/subscriptions\/([a-zA-Z0-9]+)\/find\/?$/, findSubscriptionUpdates.checkSubscriptionForUpdates);

  // update specific subscription with torrent
  server.put(/^\/subscriptions\/([a-zA-Z0-9]+)\/update\/?$/, updateSubscription.updateSubscriptionWithTorrent);

  // shutdown
  server.get(/^\/exit$/, process.exit);

  // root
  server.get(/^\/$/, function (req, res, next) {
    req.log.debug('Accessing root');
    res.redirect('/index.html', next);
  });

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
});

