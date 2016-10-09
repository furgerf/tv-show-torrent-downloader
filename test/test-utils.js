'use strict';

var sinon = require('sinon');

exports.fakeLog = {
  debug: sinon.stub(),
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub(),
  trace: sinon.stub(),
  child: sinon.stub()
};
exports.fakeLog.child.returns(exports.fakeLog);

