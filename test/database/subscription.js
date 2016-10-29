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
      ].map(subscriptionData => Subscription.createNew(subscriptionData).validate()))
        .then(function (result) {
          result.forEach(function (promise) {
            expect(promise.state).to.equal('rejected');
            expect(promise.reason.name).to.equal('ValidationError');
          });
        });
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
      ].map(subscriptionData => Subscription.createNew(subscriptionData));

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
        });
    });
  });

  describe('ensureConnected', function () {
    var fakeSubscription;

    beforeEach(function () {
      fakeSubscription = {
        ensureConnected: Subscription.model.ensureConnected,
        isInitialized: false,
        useDatabase: false
      };
    });

    it('should raise an error if called when not initialized', function (done) {
      fakeSubscription.ensureConnected()
      .fail(function (err) {
        expect(err).to.eql(new Error('Cannot establish database connection: Not initialized'));
        done();
      });
    });

    it('should not do anything when initialized to not use a real database', function (done) {
      fakeSubscription.isInitialized = true;

      fakeSubscription.ensureConnected()
      .then(function () {
        done();
      });
    });

    it('should not do anything when initialized to use a real and already connected database');

    it('should try to establish a database connection when initialized to use a real database');
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
        ].map(data => Subscription.createNew(data)),
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
      });
    });
  });

  describe('updateLastUpdateCheckTime', function () {
    var ensureConnectedStub, testee, saveStub;

    before(function () {
      ensureConnectedStub = sinon.stub(Subscription.model, 'ensureConnected');
      testee = Subscription.createNew(testUtils.getSampleSubscriptionData()[0]);
      saveStub = sinon.stub(testee, 'save');
      ensureConnectedStub.returns(testUtils.getResolvingPromise());
    });

    beforeEach(function () {
      saveStub.reset();
      ensureConnectedStub.reset();
    });

    after(function () {
      saveStub.restore();
      ensureConnectedStub.restore();
    });

    it('should successfully update the lastUpdateCheckTime', function (done) {
      var oldLastUpdateCheckTime = testee.lastUpdateCheckTime;

      testee.updateLastUpdateCheckTime()
      .then(function () {
        var afterUpdateTime = new Date(),
          newLastUpdateCheckTime = testee.lastUpdateCheckTime;

        expect(newLastUpdateCheckTime).to.be.above(oldLastUpdateCheckTime);
        expect(afterUpdateTime - newLastUpdateCheckTime).to.be.below(20);

        expect(saveStub.calledOnce).to.be.true;
        expect(ensureConnectedStub.calledOnce).to.be.true;

        done();
      });
    });
  });

  describe('updateLastDownloadTime', function () {
    var ensureConnectedStub, testee, saveStub;

    before(function () {
      ensureConnectedStub = sinon.stub(Subscription.model, 'ensureConnected');
      testee = Subscription.createNew(testUtils.getSampleSubscriptionData()[0]);
      saveStub = sinon.stub(testee, 'save');
      ensureConnectedStub.returns(testUtils.getResolvingPromise());
    });

    beforeEach(function () {
      saveStub.reset();
      ensureConnectedStub.reset();
    });

    after(function () {
      saveStub.restore();
      ensureConnectedStub.restore();
    });

    it('should successfully update the lastDownloadTime', function (done) {
      var oldLastDownloadTime = testee.lastDownloadTime;

      testee.updateLastDownloadTime()
      .then(function () {
        var afterUpdateTime = new Date(),
          newLastDownloadTime = testee.lastDownloadTime;

        expect(newLastDownloadTime).to.be.above(oldLastDownloadTime);
        expect(afterUpdateTime - newLastDownloadTime).to.be.below(20);

        expect(saveStub.calledOnce).to.be.true;
        expect(ensureConnectedStub.calledOnce).to.be.true;

        done();
      });
    });
  });

  describe('isValidUpdateToNewSeason', function () {
    beforeEach(function () {
      this.testee = Subscription.createNew(
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
      this.testee = Subscription.createNew(
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
      this.testee = Subscription.createNew(
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

  describe('isSameOrNextEpisode', function () {
    beforeEach(function () {
      this.testee1 = Subscription.createNew(
        {
          name: 'testee',
          lastSeason: 2,
          lastEpisode: 3
        }
      );
      this.testee2 = Subscription.createNew(
        {
          name: 'testee',
          lastSeason: 5,
          lastEpisode: 0
        }
      );
      this.testee1.log = testUtils.getFakeLog();
      this.testee2.log = testUtils.getFakeLog();
    });

    it('should reject wrong episodes', function () {
      expect(this.testee1.isSameOrNextEpisode(2, -1)).to.be.false;
      expect(this.testee1.isSameOrNextEpisode(2, 0)).to.be.false;
      expect(this.testee1.isSameOrNextEpisode(2, 1)).to.be.false;
      expect(this.testee1.isSameOrNextEpisode(2, 2)).to.be.false;
      expect(this.testee1.isSameOrNextEpisode(2, 5)).to.be.false;

      expect(this.testee2.isSameOrNextEpisode(5, -1)).to.be.false;
      expect(this.testee2.isSameOrNextEpisode(5, 2)).to.be.false;
      expect(this.testee2.isSameOrNextEpisode(5, 3)).to.be.false;
    });

    it('should reject wrong seasons', function () {
      expect(this.testee1.isSameOrNextEpisode(1, 3)).to.be.false;
      expect(this.testee1.isSameOrNextEpisode(1, 4)).to.be.false;
      expect(this.testee1.isSameOrNextEpisode(3, 3)).to.be.false;
      expect(this.testee1.isSameOrNextEpisode(3, 4)).to.be.false;

      expect(this.testee2.isSameOrNextEpisode(4, 0)).to.be.false;
      expect(this.testee2.isSameOrNextEpisode(4, 1)).to.be.false;
      expect(this.testee2.isSameOrNextEpisode(7, 0)).to.be.false;
      expect(this.testee2.isSameOrNextEpisode(7, 1)).to.be.false;
    });

    it('should accept the same episode', function () {
      expect(this.testee1.isSameOrNextEpisode(2, 3)).to.be.true;

      expect(this.testee2.isSameOrNextEpisode(5, 0)).to.be.true;
    });

    it('should accept the next episode', function () {
      expect(this.testee1.isSameOrNextEpisode(2, 4)).to.be.true;

      expect(this.testee2.isSameOrNextEpisode(5, 1)).to.be.true;
    });

    it('should accept the first episode of the next season', function () {
      expect(this.testee1.isSameOrNextEpisode(3, 0)).to.be.true;
      expect(this.testee1.isSameOrNextEpisode(3, 1)).to.be.true;

      expect(this.testee2.isSameOrNextEpisode(6, 0)).to.be.true;
      expect(this.testee2.isSameOrNextEpisode(6, 1)).to.be.true;
    });
  });

  describe('preSaveAction', function () {
    var nextStub = sinon.stub(),
      now = new Date(),
      newSubscriptionData = {
        name: 'asdf'
      },
      existingSubscriptionData = {
        name: 'foobar',
        searchParameters: 'bar',
        lastSeason: 12,
        lastEpisode: 34,
        creationTime: now,
        lastModifiedTime: now,
        lastDownloadTime: now,
        lastUpdateCheckTime: now
      },
      newSubscription,
      existingSubscription,

      ensureConnectedStub,
      realSubscriptionLog;

    before(function () {
      var extractedPreSaveAction = testUtils.extractSubscriptionPreSaveAction();

      // set up new "mongoose subscriptions": copy the subscription data and add
      // the extracted pre-save action so that when invoked, it is bound to the "subscription"
      newSubscription = {
        name: newSubscriptionData.name,
        explicitPreSaveAction: extractedPreSaveAction
      };
      existingSubscription = {
        name: existingSubscriptionData.name,
        searchParameters: existingSubscriptionData.searchParameters,
        lastSeason: existingSubscriptionData.lastSeason,
        lastEpisode: existingSubscriptionData.lastEpisode,
        creationTime: existingSubscriptionData.creationTime,
        lastModifiedTime: existingSubscriptionData.lastModifiedTime,
        lastDownloadTime: existingSubscriptionData.lastDownloadTime,
        lastUpdateCheckTime: existingSubscriptionData.lastUpdateCheckTime,
        explicitPreSaveAction: extractedPreSaveAction
      };

      // stub the real Subscription's ensureConnected
      ensureConnectedStub = sinon.stub(Subscription.model, 'ensureConnected');
      ensureConnectedStub.returns(testUtils.getResolvingPromise());

      // replace real log
      realSubscriptionLog = Subscription.model.log;
      Subscription.model.log = testUtils.getFakeLog();
    });

    beforeEach(function () {
      nextStub.reset();
    });

    after(function () {
      ensureConnectedStub.restore();
      Subscription.model.log = realSubscriptionLog;
    });

    it('should modify a new subscription as expected', function (done) {
      newSubscription.explicitPreSaveAction(nextStub)
      .then(function () {
        var afterUpdate = new Date();

        // ensure some properties aren't modified
        expect(newSubscription.name).to.eql(newSubscriptionData.name);
        expect(newSubscription.lastDownloadTime).to.not.exist;
        expect(newSubscription.lastUpdateCheckTime).to.not.exist;

        // ensure most properties ARE modified
        expect(newSubscription.searchParameters).to.not.eql(newSubscriptionData.searchParameters);
        expect(newSubscription.searchParameters).to.eql('');

        expect(newSubscription.lastSeason).to.not.eql(newSubscriptionData.lastSeason);
        expect(newSubscription.lastSeason).to.eql(1);

        expect(newSubscription.lastEpisode).to.not.eql(newSubscriptionData.lastEpisode);
        expect(newSubscription.lastEpisode).to.eql(0);

        expect(newSubscription.creationTime).to.not.eql(newSubscriptionData.creationTime);
        expect(newSubscription.creationTime - afterUpdate).to.be.below(20);

        expect(newSubscription.lastModifiedTime).to.not.eql(newSubscriptionData.lastModifiedTime);
        expect(newSubscription.lastModifiedTime - afterUpdate).to.be.below(20);

        expect(nextStub.calledOnce).to.be.true;

        done();
      });
    });

    it('should modify an existing subscription as expected', function (done) {
      existingSubscription.explicitPreSaveAction(nextStub)
      .then(function () {
        var afterUpdate = new Date();

        // ensure most properties aren't modified
        expect(existingSubscription.name).to.eql(existingSubscriptionData.name);
        expect(existingSubscription.searchParameters).to.eql(existingSubscriptionData.searchParameters);
        expect(existingSubscription.lastSeason).to.eql(existingSubscriptionData.lastSeason);
        expect(existingSubscription.lastEpisode).to.eql(existingSubscriptionData.lastEpisode);


        expect(existingSubscription.creationTime).to.eql(existingSubscriptionData.creationTime);
        expect(existingSubscription.lastDownloadTime).to.eql(existingSubscriptionData.lastDownloadTime);
        expect(existingSubscription.lastUpdateCheckTime).to.eql(existingSubscriptionData.lastUpdateCheckTime);

        // ensure some properties ARE modified
        expect(existingSubscription.lastModifiedTime).to.be.above(existingSubscriptionData.lastModifiedTime);
        expect(existingSubscription.lastModifiedTime - afterUpdate).to.be.below(20);

        expect(nextStub.calledOnce).to.be.true;

        done();
      });
    });
  });

  describe('initialize', function () {
    var fakeLog = testUtils.getFakeLog(),
      fakeSubscription;

    beforeEach(function () {
      fakeSubscription = {
        initialize: Subscription.model.initialize,
        isInitialized: false,
        useDatabase: false
      };
    });

    it('should throw an error when initialized without a log', function () {
      expect(fakeSubscription.isInitialized).to.be.not.ok;

      expect(() => fakeSubscription.initialize()).to.throw('Cannot initialize Subscription without log!');
      expect(() => fakeSubscription.initialize(null)).to.throw('Cannot initialize Subscription without log!');

      expect(fakeSubscription.isInitialized).to.be.not.ok;
    });

    it('should throw an error when initialized multiple times', function () {
      expect(fakeSubscription.isInitialized).to.be.not.ok;

      // successful initialization
      fakeSubscription.initialize(fakeLog);

      expect(fakeSubscription.isInitialized).to.be.true;

      // unsuccessful initialization
      expect(() => fakeSubscription.initialize()).to.throw('Subscription is already initialized!');

      expect(fakeSubscription.isInitialized).to.be.true;
    });

    it('should successfully initialize when not using a real database', function () {
      expect(fakeSubscription.isInitialized).to.be.not.ok;

      fakeSubscription.initialize(fakeLog);

      expect(fakeSubscription.isInitialized).to.be.true;
    });

    it('should successfully initialize when using a real database', function () {
      var config = {
        host: 'foo',
        port: 123
      };

      expect(fakeSubscription.isInitialized).to.be.not.ok;

      fakeSubscription.initialize(fakeLog, config);

      expect(fakeSubscription.isInitialized).to.be.true;

      // can't verify that mongoose/process event handlers were registered because a mongoose model
      // can't be rewired
    });
  });

  describe('findSubscriptionByName', function () {
    var fakeSubscription,
      findOneStub;

    beforeEach(function () {
      findOneStub = sinon.stub(),
      fakeSubscription = {
        ensureConnected: () => testUtils.getResolvingPromise(),
        findSubscriptionByName: Subscription.model.findSubscriptionByName,
        findOne: findOneStub
      };
    });

    it('should make the expected database calls', function () {
      var testNames = [
        undefined,
        null,
        123,
        new Date(),
        'foobar',
      ];

      return Q.allSettled(testNames.map(name => fakeSubscription.findSubscriptionByName(name)))
        .then(function () {
          expect(findOneStub.callCount).to.eql(testNames.length);

          testNames.forEach(function (name) {
            expect(findOneStub.calledWith({name: name})).to.be.true;
            //sinon.assert.calledWith(fakeSubscription.Subscription.findOne, {name: name});
          });
        });
    });

    it('should return a promise that resolves to the data from the database', function () {
      var testName = 'foobar',
        databaseResult = 123;

      findOneStub.withArgs({name: testName}).returns(databaseResult);

      return fakeSubscription.findSubscriptionByName(testName)
        .then(result => expect(result).to.equal(databaseResult));
    });
  });

  describe('findAllSubscriptions', function () {
    var fakeSubscription,
      findStub,
      skipStub,
      limitStub;

    beforeEach(function () {
      findStub = sinon.stub();
      skipStub = sinon.stub();
      limitStub = sinon.stub();

      findStub.returns({skip: skipStub});
      skipStub.returns({limit: limitStub});

      fakeSubscription = {
        ensureConnected: () => testUtils.getResolvingPromise(),
        findAllSubscriptions: Subscription.model.findAllSubscriptions,
        find: findStub
      };
    });

    it('should make the expected database call when invoked without arguments', function () {
      return fakeSubscription.findAllSubscriptions()
        .then(function () {
          expect(findStub.calledOnce).to.be.true;
          expect(skipStub.calledOnce).to.be.true;
          expect(skipStub.calledWith(0)).to.be.true;
          expect(limitStub.notCalled).to.be.true;
        });
    });

    it('should make the expected database call when invoked with a limit', function () {
      var testLimit = 123;

      return fakeSubscription.findAllSubscriptions(testLimit)
        .then(function () {
          expect(findStub.calledOnce).to.be.true;
          expect(skipStub.calledOnce).to.be.true;
          expect(skipStub.calledWith(0)).to.be.true;
          expect(limitStub.calledOnce).to.be.true;
          expect(limitStub.calledWith(testLimit)).to.be.true;
        });
    });

    it('should make the expected database call when invoked with an offset', function () {
      var testOffset = 123;

      return fakeSubscription.findAllSubscriptions(undefined, testOffset)
        .then(function () {
          expect(findStub.calledOnce).to.be.true;
          expect(skipStub.calledOnce).to.be.true;
          expect(skipStub.calledWith(testOffset)).to.be.true;
          expect(limitStub.notCalled).to.be.true;
        });
    });

    it('should make the expected database call when invoked with limit and offset', function () {
      var testLimit = 123,
        testOffset = 456;

      return fakeSubscription.findAllSubscriptions(testLimit, testOffset)
        .then(function () {
          expect(findStub.calledOnce).to.be.true;
          expect(skipStub.calledOnce).to.be.true;
          expect(skipStub.calledWith(testOffset)).to.be.true;
          expect(limitStub.calledOnce).to.be.true;
          expect(limitStub.calledWith(testLimit)).to.be.true;
        });
    });
  });
});

