'use strict';

const root = './../../src/';

var expect = require('chai').expect,
  sinon = require('sinon'),
  Q = require('q'),

  testUtils = require(root + '../test/test-utils'),
  Subscription = require(root + 'database/subscription');

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
    it('should only return some specific data', function () {
      var now = new Date(),
        subscriptions = [
          {name: 'foo'},
          {foo: 'bar'},
          {
            name: 'foobar',
            searchParameters: 'bar',
            lastSeason: 12,
            lastEpisode: 34,
            creationTime: now,
            lastModifiedTime: now,
            lastDownloadTime: now,
            lastUpdateCheckTime: now
          }
        ].map(data => new Subscription(data)),
        returnables = [
          {
            name: 'foo',
            searchParameters: undefined,
            lastSeason: undefined,
            lastEpisode: undefined,
            creationTime: null,
            lastModifiedTime: null,
            lastDownloadTime: null,
            lastUpdateCheckTime: null,
          },
          {
            name: undefined,
            searchParameters: undefined,
            lastSeason: undefined,
            lastEpisode: undefined,
            creationTime: null,
            lastModifiedTime: null,
            lastDownloadTime: null,
            lastUpdateCheckTime: null,
          },
          {
            name: 'foobar',
            searchParameters: 'bar',
            lastSeason: 12,
            lastEpisode: 34,
            creationTime: now,
            lastModifiedTime: now,
            lastDownloadTime: now,
            lastUpdateCheckTime: now
          }
        ];

      subscriptions[0].foo = 123;
      subscriptions[1].bar = 123;
      subscriptions[2].foobar  = 123;

      subscriptions.forEach(function (sub, index) {
        expect(sub.getReturnable()).to.eql(returnables[index]);
      })
    });
  });

  describe('isValidUpdateToNewSeason', function () {
    beforeEach(function () {
      this.testee = new Subscription(
        {
          name: 'testee',
          lastSeason: 2,
          lastEpisode: 3
        }
      );
      this.testee.log = testUtils.getFakeLog();
    });

    it('should reject invalid season updates', function () {
      expect(this.testee.isValidUpdateToNewSeason(2, 4)).to.be.false;
      expect(this.testee.isValidUpdateToNewSeason(3, 0)).to.be.false;

      expect(this.testee.isValidUpdateToNewSeason(1, 1)).to.be.false;
      expect(this.testee.isValidUpdateToNewSeason(2, 1)).to.be.false;
      expect(this.testee.isValidUpdateToNewSeason(4, 1)).to.be.false;
    });

    it('should accept a valid season update', function () {
      expect(this.testee.isValidUpdateToNewSeason(3, 1)).to.be.true;
    });
  });

  describe('isValidUpdateInSameSeason', function () {
    beforeEach(function () {
      this.testee = new Subscription(
        {
          name: 'testee',
          lastSeason: 2,
          lastEpisode: 3
        }
      );
      this.testee.log = testUtils.getFakeLog();
    });

    it('should reject invalid episode updates', function () {
      expect(this.testee.isValidUpdateInSameSeason(2, 0)).to.be.false;
      expect(this.testee.isValidUpdateInSameSeason(2, 3)).to.be.false;
      expect(this.testee.isValidUpdateInSameSeason(2, 5)).to.be.false;

      expect(this.testee.isValidUpdateInSameSeason(3, 1)).to.be.false;
    });

    it('should accept a valid episode update', function () {
      expect(this.testee.isValidUpdateInSameSeason(2, 4)).to.be.true;
    });
  });

  describe('updateLastEpisode', function () {
    beforeEach(function () {
      this.testee = new Subscription(
        {
          name: 'testee',
          lastSeason: 2,
          lastEpisode: 3
        }
      );
      this.testee.log = testUtils.getFakeLog();
    });

    it('should reject invalid arguments', function () {
      expect(this.testee.updateLastEpisode()).to.be.false;
      expect(this.testee.updateLastEpisode(123)).to.be.false;
      expect(this.testee.updateLastEpisode(null, 123)).to.be.false;
      expect(this.testee.updateLastEpisode(123, 'foo')).to.be.false;
      expect(this.testee.updateLastEpisode('bar', 123)).to.be.false;

      expect(this.testee.lastSeason).to.eql(2);
      expect(this.testee.lastEpisode).to.eql(3);
    });

    it('should reject invalid update attempts', function () {
      expect(this.testee.updateLastEpisode(1, 2), 'Do not allow season decrease').to.be.false;
      expect(this.testee.updateLastEpisode(2, 2), 'Do not allow episode decrease').to.be.false;

      expect(this.testee.updateLastEpisode(2, 3), 'Do not allow same season/episode').to.be.false;

      expect(this.testee.updateLastEpisode(2, 5), 'Do not allow skipping episodes').to.be.false;
      expect(this.testee.updateLastEpisode(4, 1), 'Do not allow skipping season season').to.be.false;

      expect(this.testee.updateLastEpisode(3, 0), 'Do not allow new season if episode is not 1').to.be.false;
      expect(this.testee.updateLastEpisode(3, 2), 'Do not allow new season if episode is not 1').to.be.false;

      expect(this.testee.lastSeason).to.eql(2);
      expect(this.testee.lastEpisode).to.eql(3);
    });

    it('should accept valid update attempts', function () {
      expect(this.testee.updateLastEpisode(2, 4), 'Allow episode increase by one').to.be.true;
      expect(this.testee.lastSeason).to.eql(2);
      expect(this.testee.lastEpisode).to.eql(4);

      expect(this.testee.updateLastEpisode(2, 5), 'Allow episode increase by one').to.be.true;
      expect(this.testee.lastSeason).to.eql(2);
      expect(this.testee.lastEpisode).to.eql(5);

      expect(this.testee.updateLastEpisode(3, 1), 'Allow season increase by one').to.be.true;
      expect(this.testee.lastSeason).to.eql(3);
      expect(this.testee.lastEpisode).to.eql(1);
    });
  });

  describe('preSaveAction', function () {
    it('should modify the subscription as expected');
  });

  describe('findSubscriptionByName', function () {
    var fakeSubscription = testUtils.getFakeStaticSubscription(Subscription);
    fakeSubscription.Subscription.initialize(testUtils.getFakeLog());

    beforeEach(function () {
      fakeSubscription.findOneStub.reset();
    });

    it('should make the expected database calls', function () {
      var testNames = [
          undefined,
          null,
          123,
          new Date(),
          'foobar',
        ];

      return Q.allSettled(testNames.map(name => fakeSubscription.Subscription.findSubscriptionByName(name)))
        .then(function (result) {
          testNames.forEach(function (name) {
            sinon.assert.calledWith(fakeSubscription.Subscription.findOne, {name: name});
          });
        });
    });

    it('should return a promise that resolves to the data from the database', function () {
      var databaseResult = 123;

      fakeSubscription.findOneStub.withArgs({name: 'foobar'}).returns(databaseResult);

      return fakeSubscription.Subscription.findSubscriptionByName('foobar')
      .then(result => expect(result).to.equal(databaseResult));
    });

  });

  describe('findAllSubscriptions', function () {
    // the fakeSubscription needs "any" subscriptions so the limit/skip stubs get all set up
    var fakeSubscription = testUtils.getFakeStaticSubscription(Subscription, []);
    fakeSubscription.Subscription.initialize(testUtils.getFakeLog());

    beforeEach(function () {
      fakeSubscription.findStub.reset();
      fakeSubscription.skipStub.reset();
      fakeSubscription.limitStub.reset();
    });

    it('should make the expected database call when invoked without arguments', function () {
      return fakeSubscription.Subscription.findAllSubscriptions()
        .then(function (result) {
          sinon.assert.called(fakeSubscription.findStub);
          sinon.assert.calledWith(fakeSubscription.skipStub, 0);
          sinon.assert.notCalled(fakeSubscription.limitStub);
        });
    });

    it('should make the expected database call when invoked with a limit', function () {
      return fakeSubscription.Subscription.findAllSubscriptions(123)
        .then(function (result) {
          sinon.assert.called(fakeSubscription.findStub);
          sinon.assert.calledWith(fakeSubscription.skipStub, 0);
          sinon.assert.calledWith(fakeSubscription.limitStub, 123);
        });
    });

    it('should make the expected database call when invoked with an offset', function () {
      return fakeSubscription.Subscription.findAllSubscriptions(undefined, 123)
        .then(function (result) {
          sinon.assert.called(fakeSubscription.findStub);
          sinon.assert.calledWith(fakeSubscription.skipStub, 123);
          sinon.assert.notCalled(fakeSubscription.limitStub);
        });
    });

    it('should make the expected database call when invoked with limit and offset', function () {
      return fakeSubscription.Subscription.findAllSubscriptions(123, 456)
        .then(function (result) {
          sinon.assert.called(fakeSubscription.findStub);
          sinon.assert.calledWith(fakeSubscription.skipStub, 456);
          sinon.assert.calledWith(fakeSubscription.limitStub, 123);
        });
    });
  });
});

