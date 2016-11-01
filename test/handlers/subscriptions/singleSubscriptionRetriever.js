'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  rewire = require('rewire'),

  Subscription = require(root + 'database/subscription'),
  testUtils = require('../../test-utils'),
  RewiredSingleSubscriptionRetriever = rewire(root + 'handlers/subscriptions/singleSubscriptionRetriever');

describe('singleSubscriptionRetriever', function () {
  describe('retrieve', function () {
    var findSubscriptionByNameStub,
      restoreSubscriptionRetriever,

      sampleSubscriptions = testUtils.getSampleSubscriptions(),
      getUrlForSubscription = name => '/subscriptions/' + name,

      fakeReq,
      fakeRes = null;

    before(function () {
      var fakeSubscription = testUtils.getFakeFindSubscription();
      findSubscriptionByNameStub = fakeSubscription.findSubscriptionByName;

      restoreSubscriptionRetriever = RewiredSingleSubscriptionRetriever.__set__('Subscription', fakeSubscription);

      fakeReq = {
        log: testUtils.getFakeLog(),
        url: 'ASSIGN ME'
      };
    });

    beforeEach(function () {
      findSubscriptionByNameStub.reset();
    });

    after(function () {
      restoreSubscriptionRetriever();
    });

    it("should do nothing if the url has no single subscription: '" + sampleSubscriptions[0].name + "'", function (done) {
      fakeReq.url = sampleSubscriptions[0].name;
      RewiredSingleSubscriptionRetriever.retrieve(fakeReq, fakeRes, function () {
        expect(findSubscriptionByNameStub.notCalled).to.be.true;
        expect(fakeReq.subscription).to.not.exist;
        done();
      });
    });

    it("should do nothing if the url has no single subscription: '" + getUrlForSubscription('') + "'", function (done) {
      fakeReq.url = getUrlForSubscription('');
      RewiredSingleSubscriptionRetriever.retrieve(fakeReq, fakeRes, function () {
        expect(findSubscriptionByNameStub.notCalled).to.be.true;
        expect(fakeReq.subscription).to.not.exist;
        done();
      });
    });

    it('should be able to handle a failure when finding the subscription', function (done) {
      var subscription = sampleSubscriptions[0],
        originalFakeReqLog = fakeReq.log;
      fakeReq.log = null;
      // explanation: because the stub's `throws` doesn't seem to work, I'm manufacturing an
      // exception while handling the database response by setting the log to null
      // consequently, if that log statement is removed, this test would fail

      fakeReq.url = getUrlForSubscription(subscription.name);

      RewiredSingleSubscriptionRetriever.retrieve(fakeReq, fakeRes, function () {
        expect(findSubscriptionByNameStub.calledOnce).to.be.true;
        expect(findSubscriptionByNameStub.calledWith(subscription.name)).to.be.true;
        expect(fakeReq.subscription).to.not.exist;
        fakeReq.log = originalFakeReqLog;
        done();
      });
    });

    it("'should be able to return the correct subscription for url '" + getUrlForSubscription(sampleSubscriptions[0].name) + "'", function (done) {
      // prepare
      var subscription = sampleSubscriptions[0],
        schemaProperties = Object.getOwnPropertyNames(Subscription.model.schema.obj);
      fakeReq.url = getUrlForSubscription(subscription.name);

      var next = function () {
        // check
        expect(findSubscriptionByNameStub.calledOnce).to.be.true;
        expect(findSubscriptionByNameStub.calledWith(subscription.name)).to.be.true;

        // can't check for equality of the object apparently because of some model properties
        // so instead, we compare the schema's properties
        for (var prop in schemaProperties) {
          expect(fakeReq[prop]).to.eql(subscription[prop]);
        }

        done();
      };

      // execute
      RewiredSingleSubscriptionRetriever.retrieve(fakeReq, fakeRes, next);
    });

    it("'should be able to return the correct subscription for url '" + getUrlForSubscription(sampleSubscriptions[1].name) + "/asdf'", function (done) {
      // prepare
      var subscription = sampleSubscriptions[1],
        schemaProperties = Object.getOwnPropertyNames(Subscription.model.schema.obj);
      fakeReq.url = getUrlForSubscription(subscription.name) + '/asdf';

      var next = function () {
        // check
        expect(findSubscriptionByNameStub.calledOnce).to.be.true;
        expect(findSubscriptionByNameStub.calledWith(subscription.name)).to.be.true;

        // can't check for equality of the object apparently because of some model properties
        // so instead, we compare the schema's properties
        for (var prop in schemaProperties) {
          expect(fakeReq[prop]).to.eql(subscription[prop]);
        }

        done();
      };

      // execute
      RewiredSingleSubscriptionRetriever.retrieve(fakeReq, fakeRes, next);
    });
  });
});

