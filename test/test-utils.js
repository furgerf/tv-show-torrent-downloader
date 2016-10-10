'use strict';

var sinon = require('sinon');

/**
 * Creates an instance of FakeLog, mimicking the functions of Bunyan.Log.
 *
 * @constructor
 */
function FakeLog() {
  this.debug = sinon.stub();
  this.info = sinon.stub();
  this.warn = sinon.stub();
  this.error = sinon.stub();
  this.trace = sinon.stub();
  this.child = sinon.stub();

  this.child.returns(this);
}
/**
 * Retrieves a new instance of a stubbed bunyan log.
 *
 * @returns {Object} Fake log.
 */
exports.getFakeLog = function () { return new FakeLog(); };


/**
 * Retrieves a fake Subscription object which offers the static Subscription functionality through
 * stubs.
 * Note: If subscriptions are NOT provided, the `findOneStub` isn't set up to return anything.
 *
 * @param {Object} realSubscription - Real Subscription object to copy and stub.
 * @param {Array} subscriptions - Array of real Subscription objects that should be operated on by
 *                                the stubs.
 *
 * @returns {Object} Container for the fake Subscription and the created stubs. Contents:
 *          {Object} Subscription: Fake Subscription.
 *          {Sinon.stub} findStub: Fake Subscription's `find()`-stub.
 *          {Sinon.stub} skipStub: Fake Subscription's `skip()`-stub.
 *          {Sinon.stub} limitStub: Fake Subscription's `limit()`-stub.
 *          {Sinon.stub} findOneStub: Fake Subscription's `findOne()`-stub.
 */
exports.getFakeStaticSubscription = function (realSubscription, subscriptions) {
  var fakeSubscription = {},
    findStub,
    skipStub,
    limitStub,
    findOneStub,
    withSubscriptions = typeof subscriptions === 'object';

  // copy real Subscription
  for (var prop in realSubscription) {
    fakeSubscription[prop] = realSubscription[prop];
  }

  // set up stubs - find
  findStub = sinon.stub(fakeSubscription, 'find');
  skipStub = sinon.stub();
  limitStub = sinon.stub();

  findStub.returns({skip: skipStub});

  if (withSubscriptions) {
    subscriptions.limit = limitStub;
    skipStub.returns(subscriptions);
    limitStub.returns(subscriptions);
  }

  // set up stubs - findOne
  findOneStub = sinon.stub(fakeSubscription, 'findOne', withSubscriptions ? function (arg) {
    return subscriptions.filter(function (sub) {
      return sub.name === arg.name;
    })[0];
  } : undefined);

  return {
    Subscription: fakeSubscription,
    findStub: findStub,
    skipStub: skipStub,
    limitStub: limitStub,
    findOneStub: findOneStub
  };
};

