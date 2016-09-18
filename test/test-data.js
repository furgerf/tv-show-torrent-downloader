'use strict';

/**
 * This file contains helper constructs for the unit tests,
 * e.g. test data.
 */

/*
var rewire = require('rewire'),
  database = rewire('./../src/database/subscription'),
  Subscription = database.Subscription,
  preSaveAction = database.__get__('preSaveAction');


function getMinimalSubscription() {
  var minimalSubscription = new Subscription({ name: 'test minimal' });

  // extract, assign and execute preSaveAction
  // this is "necessary" to avoid calling Subscription.save()
  // which would include actual database interaction (and thus
  // require an actual database instance for the tests to run)

  // assign preSaveAction to the subscriptions
  minimalSubscription.preSaveAction = preSaveAction;

  // execute preSaveAction for the subscriptions
  minimalSubscription.preSaveAction(function () {});

  return minimalSubscription;
}

function getExtendedSubscription() {
  var extendedSubscription = new Subscription({ name: 'test extended', searchParameters: 'a b c',
    lastSeason: 12, lastEpisode: 34 });

  // extract, assign and execute preSaveAction
  // this is "necessary" to avoid calling Subscription.save()
  // which would include actual database interaction (and thus
  // require an actual database instance for the tests to run)

  // assign preSaveAction to the subscriptions
  extendedSubscription.preSaveAction = preSaveAction;

  // execute preSaveAction for the subscriptions
  extendedSubscription.preSaveAction(function () {});

  return extendedSubscription;
}

exports.getMinimalSubscription = getMinimalSubscription;

exports.getExtendedSubscription = getExtendedSubscription;

exports.getAllSubscriptions = function () {
  return [ getMinimalSubscription(), getExtendedSubscription() ];
};
*/

