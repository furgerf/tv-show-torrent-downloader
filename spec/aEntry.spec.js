'use strict';

/*global describe*/

var frisby = require('frisby'),

  config = require('../src/config'),

  apiUrl = 'http://' + config.api.host + ':' + config.api.port + '/';

describe('entry - say hello! :-)', function () {
  frisby.create('access server root')
    .get(apiUrl)
    .toss();
});

