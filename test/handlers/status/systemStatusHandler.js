'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  rewire = require('rewire'),

  App = require(root + 'app').App,
  config = require(root + 'common/config').getDebugConfig(),
  testUtils = require(root + '../test/test-utils'),
  RewiredSystemStatusHandler = rewire(root + 'handlers/status/systemStatusHandler');

config.api.port = 0;

describe('SystemStatusHandler', function () {
  describe('parseDiskInformation', function () {
    var parseDiskInformation = RewiredSystemStatusHandler.__get__('parseDiskInformation');

    it('should be able to handle invalid data', function () {
      expect(parseDiskInformation()).to.be.null;
      expect(parseDiskInformation(null)).to.be.null;
      expect(parseDiskInformation(123)).to.be.null;
      expect(parseDiskInformation('')).to.be.null;
      expect(parseDiskInformation('asdf')).to.be.null;
      expect(parseDiskInformation('fo o b a r')).to.be.null;
    });

    it('should be able to parse valid data', function () {
      expect(parseDiskInformation('type size used avail use% mountpoint')).to.eql(
        {
          mountPoint: 'mountpoint',
          spaceUsed: 'used',
          spaceAvailable: 'avail'
        });
      expect(parseDiskInformation('type    size  used   avail    use%   mountpoint')).to.eql(
        {
          mountPoint: 'mountpoint',
          spaceUsed: 'used',
          spaceAvailable: 'avail'
        });
      expect(parseDiskInformation('type size used avail use% mount point with spaces')).to.eql(
        {
          mountPoint: 'mount point with spaces',
          spaceUsed: 'used',
          spaceAvailable: 'avail'
        });
    });
  });

  describe('requests', function () {
    var server,
      app;

    describe('GET /system/status/disk', function () {
      beforeEach(function (done) {
        var that = this;

        // prepare data - return sample data on the first call, if the correct command is used
        // throw an exception on the second call - there's no way around doing it like that because
        // all calls are exactly the same
        this.fakeExec = function (command, callback) {
          that.calls = that.calls || 0;
          that.calls++;

          if (that.calls > 2) {
            return callback('This is an error');
          }
          if (that.calls > 1) {
            throw new Error('Fake exec failed!');
          }

          return command === 'df -x tmpfs -x devtmpfs | tail -n +2'
            ? callback(null,  '/dev/sda1       165G  119G   38G  76% /\n\n/dev/sdb2       766G  730G   36G  96% /foo')
            : callback('Unexpected invocation');
        };

        // injec fake exec
        RewiredSystemStatusHandler.__set__('exec', this.fakeExec);

        // create app and replace handler
        app = new App(config, testUtils.getFakeLog());
        app.systemStatusHandler = new RewiredSystemStatusHandler(testUtils.getFakeLog());

        // start server
        app.listen(function () {
          var url = 'http://' + this.address().address + ':' + this.address().port;
          server = supertest.agent(url);
          done();
        });
      });

      afterEach(function (done) {
        app.close(done);
      });

      it('should correctly return sample data', function (done) {
        server
          .get('/status/system/disk')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql([
              {
                mountPoint: "/",
                spaceUsed: "119G",
                spaceAvailable: "38G"
              },
              {
                mountPoint: "/foo",
                spaceUsed: "730G",
                spaceAvailable: "36G"
              },
            ]);
            done();
          });
      });

      it('should be able to deal with a failing command - exception', function (done) {
        server
          .get('/status/system/disk')
          .expect('Content-type', 'application/json')
          .expect(500)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('InternalServerError');
            done();
          });
      });

      it('should be able to deal with a failing command - error object', function (done) {
        server
          .get('/status/system/disk')
          .expect('Content-type', 'application/json')
          .expect(500)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('InternalServerError');
            done();
          });
      });
    });
  });
});

