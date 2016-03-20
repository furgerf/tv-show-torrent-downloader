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
    subscription = require('./src/endpoints/subscription'),
    updates = require('./src/endpoints/update'),

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

// hooks for connection logging
server.pre(function (req, res, next) {
  req.log.info({req: req}, 'New connection (%d)', connectionCount++);
  requestStarts[req.id()] = new Date();
  next();
});
server.on('after', function (req, res, route) {
  var duration = new Date().getTime() - requestStarts[req.id()].getTime();
  delete requestStarts[req.id()];

  req.log.info({res: res}, 'Finished handling request in %d ms', duration);
});
server.on('uncaughtException', function (req, res, route, error) {
  req.log.error(error, 'Uncaught exception');
  res.send(new restify.InternalServerError('%s (%s)', error.name || '', error.message || error));
});

// connect to database
database.connect();

// start server
server.listen(config.api.port, config.api.host, function () {
  log.info('TV show downloader API running on %s:%s ', config.api.host, config.api.port);

  // subscriptions
  server.get(/^\/subscription\/?$/, subscription.getSubscriptions);
  server.get(/^\/subscription\/(.+)\/?$/, subscription.getSubscription);
  server.post(/^\/subscription\/?$/, subscription.addSubscription);
  server.del(/^\/subscription\/(.+)\/?$/, subscription.deleteSubscription);

  // updates
  server.get(/^\/update\/check\/?$/, updates.checkAllForUpdates);
  server.get(/^\/update\/check\/(.+)\/?$/, updates.checkSubscriptionForUpdates);

  // shutdown
  server.get(/^\/exit$/, process.exit);

  // root
  server.get(/^\/$/, function (req, res, next) {
    req.log.debug('Accessing root');
    res.redirect('/index.html', next);
});

  // evertything else... try public FS
  server.get(/^\/([a-zA-Z0-9_\/\.~-]*)/, function (req, res, next) {
    var //url = parse(req.url),
        path = join(root, req.params[0]),
        stream = fs.createReadStream(path);
    req.log.debug('Accessing path %s', path);

    stream.pipe(res);
  });
});

