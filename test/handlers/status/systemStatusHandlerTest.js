'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  rewire = require('rewire'),
  config = require(root + 'common/config').getDebugConfig(),
  logger = require(root + 'common/logger'),
  App = require(root + 'app').App;

config.api.port = 0;
config.logging.stdoutLoglevel = 'error';

describe('SystemStatusHandler', function () {
  beforeEach(function () {
    this.RewiredSystemStatusHandler = rewire(root + 'handlers/status/systemStatusHandler');
  });

  describe('parseDiskInformation', function () {
    beforeEach(function () {
      this.parseDiskInformation = this.RewiredSystemStatusHandler.__get__('parseDiskInformation');
    });

    it('should be able to handle invalid data', function () {
      expect(this.parseDiskInformation()).to.be.null;
      expect(this.parseDiskInformation(null)).to.be.null;
      expect(this.parseDiskInformation(123)).to.be.null;
      expect(this.parseDiskInformation('')).to.be.null;
      expect(this.parseDiskInformation('asdf')).to.be.null;
      expect(this.parseDiskInformation('fo o b a r')).to.be.null;
    });

    it('should be able to parse valid data', function () {
      expect(this.parseDiskInformation('type size used avail use% mountpoint')).to.eql(
        {
          mountPoint: 'mountpoint',
          spaceUsed: 'used',
          spaceAvailable: 'avail'
        });
      expect(this.parseDiskInformation('type    size  used   avail    use%   mountpoint')).to.eql(
        {
          mountPoint: 'mountpoint',
          spaceUsed: 'used',
          spaceAvailable: 'avail'
        });
      expect(this.parseDiskInformation('type size used avail use% mount point with spaces')).to.eql(
        {
          mountPoint: 'mount point with spaces',
          spaceUsed: 'used',
          spaceAvailable: 'avail'
        });
    });
  });

  describe('requests', function () {
    describe('GET /system/status/disk', function () {
      beforeEach(function (done) {
        // prepare data
        var that = this,
          log = logger.createLogger(config.logging).child({component: 'test-server'}),
          execMock = function (command, callback) {
            return command === 'df -x tmpfs -x devtmpfs | tail -n +2'
              ? callback(null,  '/dev/sda1       165G  119G   38G  76% /\n\n/dev/sdb2       766G  730G   36G  96% /foo')
              : callback('Unexpected invocation');
          };

        // injec mocked exec
        this.RewiredSystemStatusHandler.__set__('exec', execMock);

        // create app and replace handler
        this.app = new App(config, log);
        this.app.systemStatusHandler = new this.RewiredSystemStatusHandler(log);

        // start server
        this.app.listen(function () {
          var url = 'http://' + this.address().address + ':' + this.address().port;
          that.server = supertest.agent(url);
          done();
        });
      });
      afterEach(function (done) {
        this.app.close(done);
      });

      it('should correctly return sample data', function (done) {
        this.server
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
    });
  });
});

