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

  // copy real Subscription - also need prototype properties!
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

exports.nonexistentSubscriptionName = 'nonexistent subscription';

