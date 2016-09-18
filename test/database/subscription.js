'use strict';

const root = './../../src/';

var expect = require('chai').expect,
  Q = require('q'),

  Subscription = require(root + 'database/subscription').Subscription;

describe('database/subscription', function () {
  describe('validate schema', function () {
    it('should reject invalid schemas', function () {
      return Q.allSettled([
        {},
        {foo: 123},
        {name: 123, lastSeason: 'asdf'},
        {name: 123, lastEpisode: 'asdf'},
        {name: 123, creationTime: 'asdf'},
        {name: 123, lastModifiedTime: 'asdf'},
        {name: 123, lastDownloadTime: 'asdf'},
        {name: 123, lastUpdateCheckTime: 'asdf'}
      ].map(subscriptionData => new Subscription(subscriptionData).validate()))
        .then(function (result) {
          result.forEach(function (promise) {
            expect(promise.state).to.equal('rejected');
            expect(promise.reason.name).to.equal('ValidationError');
          });
        })
    });

    it('should cast data types where possible', function () {
      var subscriptions = [
        {name: 123},
        {name: 123, searchParameters: new Date()},
        {name: 123, lastSeason: '123'},
        {name: 123, lastEpisode: '456'},
        {name: 123, creationTime: 123},
        {name: 123, lastModifiedTime: '123'},
        {name: 123, lastDownloadTime: 4569780988973},
        {name: 123, lastUpdateCheckTime: '4569780988973'},
      ].map(subscriptionData => new Subscription(subscriptionData));

      // check the types
      subscriptions.forEach(function (subscription) {
        expect(subscription.name).to.be.a('string');
        if (subscription.searchParameters) {
          expect(subscription.searchParameters).to.be.a('string');
        }
        if (subscription.lastSeason) {
          expect(subscription.lastSeason).to.be.a('number');
        }
        if (subscription.lastEpisode) {
          expect(subscription.lastEpisode).to.be.a('number');
        }
        if (subscription.creationTime) {
          expect(subscription.creationTime).to.be.a('date');
        }
        if (subscription.lastModifiedTime) {
          expect(subscription.lastModifiedTime).to.be.a('date');
        }
        if (subscription.lastDownloadTime) {
          expect(subscription.lastDownloadTime).to.be.a('date');
        }
        if (subscription.lastUpdateCheckTime) {
          expect(subscription.lastUpdateCheckTime).to.be.a('date');
        }
      });

      // check that the subscriptions validate successfully
      return Q.allSettled(subscriptions.map(subscription => subscription.validate()))
        .then(function (result) {
          result.forEach(function (promise) {
            expect(promise.state).to.equal('fulfilled');
          });
        })
    });
  });

  describe('getReturnableSubscription', function () {
    it('should only return some specific data');
  });

  describe('updateLastEpisode', function () {
    it('should reject invalid arguments');
    it('should reject invalid update attempts');
    it('should accept valid update attempts');
  });

  describe('preSaveAction', function () {
    it('should modify the subscription as expected');
  });
});

