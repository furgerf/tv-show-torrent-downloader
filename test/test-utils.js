'use strict';

var Q = require('q'),
  sinon = require('sinon');

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

exports.nonexistentSubscriptionName = 'nonexistent subscription';

