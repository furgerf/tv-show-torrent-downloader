'use strict';

var Q = require('q'),
  sinon = require('sinon'),

  Subscription = require('../src/database/subscription');

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
 * Retrieves an empty Q promise that resolves to the provided value.
 *
 * @param {Any} result - Value to resolve to.
 *
 * @returns {Promise} Resolving promise.
 */
exports.getResolvingPromise = function (result) {
  // jshint unused: false
  return Q.promise((resolve, reject) => resolve(result));
};

/**
 * Retrieves an empty Q promise that rejects with the provided error.
 *
 * @param {Any} err - Error to reject with.
 *
 * @returns {Promise} Rejecting promise.
 */
exports.getRejectingPromise = function (err) {
  // jshint unused: false
  return Q.promise((resolve, reject) => reject(err));
};


var sampleSubscriptionData = [
  {
    _id : '574169af750120fa451a53b8',
    creationTime : new Date('2016-05-22T08:11:27.922Z'),
    name : 'foo',
    searchParameters : '720p',
    lastSeason : 12,
    lastEpisode : 23,
    __v : 0,
    lastModifiedTime : new Date('2016-09-18T14:00:15.404Z'),
    lastUpdateCheckTime : new Date('2016-09-18T14:00:15.398Z'),
    lastDownloadTime : new Date('2016-05-22T00:00:00.000Z')
  },
  {
    _id : '574167b451d4b90f075c889c',
    creationTime : new Date('2016-05-22T08:03:00.633Z'),
    name : 'bar',
    searchParameters : null,
    lastSeason : 3,
    lastEpisode : 3,
    __v : 0,
    lastModifiedTime : new Date('2016-09-26T14:00:06.135Z'),
    lastUpdateCheckTime : new Date('2016-09-26T14:00:06.131Z'),
    lastDownloadTime : new Date('2012-12-21T00:00:00.000Z')
  },
  {
    _id : '5676ef80a2ce34bb2843ce1b',
    creationTime : new Date('2015-12-20T18:12:16.100Z'),
    name : 'foobar',
    searchParameters : '1080p',
    lastSeason : 2,
    lastEpisode : 10,
    __v : 0,
    lastModifiedTime : new Date('2016-09-26T14:00:06.296Z'),
    lastUpdateCheckTime : new Date('2016-09-26T14:00:06.290Z'),
    lastDownloadTime : new Date('2015-12-14T00:00:00.000Z')
  },
  {
    _id : '5676ef80a2ce34bb2853d211',
    creationTime : new Date('2015-12-20T18:12:34.667Z'),
    name : 'test',
    searchParameters : 'test',
    lastSeason : 11,
    lastEpisode : 22,
    __v : 0,
    lastModifiedTime : new Date('2015-12-20T18:12:34.667Z'),
    lastUpdateCheckTime : new Date('2015-12-20T18:12:34.667Z'),
    lastDownloadTime : new Date('2015-12-20T18:12:34.667Z')
  }
];
exports.getSampleSubscriptionData = function () { return sampleSubscriptionData.slice(0); };

exports.getSampleSubscriptions = function () {
  return exports.getSampleSubscriptionData().map(Subscription.createNew);
};

exports.nonexistentSubscriptionName = 'nonexistent subscription';


/**
 * Extracts the Subscription's pre-save action.
 *
 * @returns {function} Extracted pre-save action.
 */
exports.extractSubscriptionPreSaveAction = function () {
  // warning, that might not work at some point in the future...
  // the pre-save action is in the callQueue - each queue item is an array wity two elements
  // the first seems to be the step in the event when the action should be triggered
  // the second seems to be the event handler
  // the event handler we're looking for has the property '0' === 'save'
  // and property '1' which is a function - the built-in handlers have a boolean at '1' and the
  // handler function at '2'
  return Subscription.model.schema.callQueue.filter(function (call) {
    return call[0] === 'pre' && call[1]['0'] === 'save' && typeof call[1]['1'] === 'function';
  })[0][1][1];
};


/**
 * Time in milliseconds in which two dates can be considered to be equal when undable to compare
 * directly (eg. only after a response was received).
 */
exports.timeEpsilon = 200;

/**
 * Gets an object offering the methods `findAllSubscriptions` and `findSubscriptionByName` that can
 * be used to replace a `Subscription` in a test.
 * The subscriptions that are returned are Subscription instances with the sample data from
 * `getSampleSubscriptionData`.
 *
 * @param {Function} transformSubscription - Optional. If specified, this transformation is applied
 *                                           to each subscription that is retrieved through these
 *                                           fake methods.
 *
 * @returns {Object} Fake subscription object.
 */
exports.getFakeFindSubscription = function (transformSubscription) {
  // transformation to apply to each subscription that is retrieved through this fake
  // can be used for example to assign some real Subscription methods
  var subscriptionTransformation = (transformSubscription || function (x) { return x; }),

    sampleSubscriptions = exports.getSampleSubscriptions(),

    findSubscriptionByNameStub = sinon.stub(
      {foo: () => null}, // stub dummy method of dummy object
      'foo',
      name => Q.fcall(() => sampleSubscriptions.find(sub => sub.name === name))
        .then(subscriptionTransformation)),

    findAllSubscriptionsStub = sinon.stub();

  findAllSubscriptionsStub.returns(Q.fcall(() => sampleSubscriptions)
    .then(subs => subs.map(subscriptionTransformation)));

  return {
    findAllSubscriptions: findAllSubscriptionsStub,
    findSubscriptionByName: findSubscriptionByNameStub
  };
};

