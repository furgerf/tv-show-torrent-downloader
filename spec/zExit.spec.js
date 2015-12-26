'use strict';

var frisby = require('frisby'),

    config = require('../src/config'),

    apiUrl = 'http://' + config.api.host + ':' + config.api.port + '/';

describe('exit - terminate server instance', function () {
  frisby.create('access exit endpoint')
    .get(apiUrl + 'exit')
    .toss();
});

