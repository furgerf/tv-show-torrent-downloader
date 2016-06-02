'use strict';

// TODO: Remove/implement

var subscriptions = require('./../test-subscriptions'),
  frisby = require('frisby');
  //subscription = require('./../../src/endpoints/subscription');

describe('subscription', function () {
  var minimalSubscription,
    extendedSubscription,
    allSubscriptions;

  beforeEach(function () {
    minimalSubscription = subscriptions.getMinimalSubscription();
    extendedSubscription = subscriptions.getExtendedSubscription();
    allSubscriptions = subscriptions.getAllSubscriptions();
  });

  /*
  it('foo', function () {
    expect(minimalSubscription.name).toBe('test minimal');
  });

  frisby.create('Return 400 error if no query is specified')
    .get(offerUrl)

    .expectStatus(400)
    .expectHeaderContains('Content-Type', 'application/json')
    .expectJSON({
      code: 'InvalidExactQuery',
      message: 'Please specify exactly one exact query.'
    })
  .toss();
  */
});

