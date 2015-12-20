'use strict';

// modules
var restify = require('restify'),

    // common files
    config = require('./src/config'),
    utils = require('./src/utils'),
    database = require('./src/database'),
    logger = require('./src/logger'),

    // endpoint handlers
    subscription = require('./src/subscription'),

    // misc variables
    log = logger.log.child({component: 'server'}),
    connectionCount = 0,
    server = restify.createServer({
      name: 'TV show downloader REST server',
      log: logger.log.child({component: 'endpoint'}),
    }),
    requestStarts = {};

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

// start server
server.listen(config.api.port, function () {
  log.info('TV show downloader API running on port ' + config.api.port);

  /* NOTE:
   *var PATH = '/hello/:name';
   * server.get({path: PATH, version: '1.1.3'}, sendV1);
   * ->   res.send({hello: req.params.name});
   */

  // subscriptions
  server.get(/^\/subscription\/?$/, subscription.getSubscriptions);
  server.get(/^\/subscription\/(.+)\/?$/, subscription.getSubscription);
  server.post(/^\/subscription\/?$/, subscription.addSubscription);
  server.del(/^\/subscription\/(.+)\/?$/, subscription.deleteSubscription);

  // Shutdown
  server.get(/^\/exit$/, process.exit);

  // Root
  server.get(/^\/$/, function (req, res) {
    res.setHeader('content-type', 'application/json');
    res.write('Welcome to the TV show downloader REST interface!\n');
    res.end();
  });
});

