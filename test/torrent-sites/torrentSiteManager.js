'use strict';

const root = './../../src/';

var expect = require('chai').expect,
  rewire = require('rewire'),
  sinon = require('sinon'),
  Q = require('q'),

  testUtils = require('../test-utils'),
  TorrentSiteManager = rewire(root + 'torrent-sites/torrentSiteManager');

describe('torrent-sites/torrentSiteManager', function () {
  describe('compareTorrents', function () {
    var now = new Date(),
      before = new Date(),

    compareTorrents = TorrentSiteManager.__get__('compareTorrents'),

    torrent1, torrent2;

    before = before.setHours(before.getHours() - 1);

    torrent1 = {
      name: 'asdf',
      season: 12,
      episode: 34,
      seeders: 56,
      leechers: 78,
      size: 12345,
      uploadDate: now,
      link: 'http://asdf.com'
    };
    torrent2 = {
      name: 'foobar',
      season: 23,
      episode: 45,
      seeders: 67,
      leechers: 89,
      size: 123456,
      uploadDate: before,
      link: 'http://foobar.com'
    };

    it('should throw an exception on invalid arguments', function () {
      expect(() => compareTorrents(torrent1, null, 'largest')).to.throw('Invalid arguments, t1 and t2 must be objects');
      expect(() => compareTorrents(null, torrent2, 'largest')).to.throw('Invalid arguments, t1 and t2 must be objects');
      expect(() => compareTorrents(null, null, 'largest')).to.throw('Invalid arguments, t1 and t2 must be objects');
      expect(() => compareTorrents(torrent1, 123, 'largest')).to.throw('Invalid arguments, t1 and t2 must be objects');
      expect(() => compareTorrents(123, torrent2, 'largest')).to.throw('Invalid arguments, t1 and t2 must be objects');
      expect(() => compareTorrents(123, 123, 'largest')).to.throw('Invalid arguments, t1 and t2 must be objects');
      expect(() => compareTorrents(torrent1, torrent2, null)).to.throw('Unknown sort: null');
      expect(() => compareTorrents(torrent1, torrent2, 123)).to.throw('Unknown sort: 123');
    });

    it('should throw an exception on unknown sort order', function () {
      expect(() => compareTorrents(torrent1, torrent2, 'asdf')).to.throw('Unknown sort: asdf');
    });

    it('should correctly sort by size', function () {
      expect(compareTorrents(torrent1, torrent2, 'largest')).to.be.true;
      expect(compareTorrents(torrent1, torrent2, 'smallest')).to.be.false;
      expect(compareTorrents(torrent2, torrent1, 'largest')).to.be.false;
      expect(compareTorrents(torrent2, torrent1, 'smallest')).to.be.true;

      expect(compareTorrents(torrent1, torrent1, 'largest')).to.be.false;
      expect(compareTorrents(torrent1, torrent1, 'smallest')).to.be.false;
    });

    it('should correctly sort by date', function () {
      expect(compareTorrents(torrent1, torrent2, 'oldest')).to.be.true;
      expect(compareTorrents(torrent1, torrent2, 'newest')).to.be.false;
      expect(compareTorrents(torrent2, torrent1, 'oldest')).to.be.false;
      expect(compareTorrents(torrent2, torrent1, 'newest')).to.be.true;

      expect(compareTorrents(torrent1, torrent1, 'oldest')).to.be.false;
      expect(compareTorrents(torrent1, torrent1, 'newest')).to.be.false;
    });

    it('should correctly sort by seeds', function () {
      expect(compareTorrents(torrent1, torrent2, 'mostseeded')).to.be.true;
      expect(compareTorrents(torrent2, torrent1, 'mostseeded')).to.be.false;

      expect(compareTorrents(torrent1, torrent1, 'mostseeded')).to.be.false;
    });
  });

  describe('selectTorrents', function () {
    var testee = new TorrentSiteManager(testUtils.getFakeLog());

    it('should manage to return if no torrents are found', function () {
      expect(testee.selectTorrents()).to.eql([]);
      expect(testee.selectTorrents([])).to.eql([]);
      expect(testee.selectTorrents([], 'foo', 123)).to.eql([]);
    });

    it('should select no more than the number of torrents that are expected', function () {
      var fakeTorrents = [
        { foo: 'foo' },
        { foobar: 'foobar' },
        { bar: 'bar' }
      ];

      expect(testee.selectTorrents(fakeTorrents, 'largest', 3)).to.eql(fakeTorrents);
      expect(testee.selectTorrents(fakeTorrents, 'largest', 2)).to.eql(fakeTorrents.slice(0, 2));
      expect(testee.selectTorrents(fakeTorrents, 'largest', 1)).to.eql(fakeTorrents.slice(0, 1));
    });

    it('should correctly select torrents based the provided criterion', function () {
      var fakeTorrent1 = { name: 'foo', size: 123 },
        fakeTorrent2 = { name: 'bar', size: 456 },
        fakeTorrents = [ fakeTorrent1, fakeTorrent2 ];

      expect(testee.selectTorrents(fakeTorrents, 'largest', 2)).to.eql([fakeTorrent2, fakeTorrent1]);
      expect(testee.selectTorrents(fakeTorrents, 'smallest', 2)).to.eql([fakeTorrent1, fakeTorrent2]);
      expect(testee.selectTorrents(fakeTorrents, 'largest', 1)).to.eql([fakeTorrent2]);
      expect(testee.selectTorrents(fakeTorrents, 'smallest', 1)).to.eql([fakeTorrent1]);
    });
  });

  describe('tryTorrentSite', function () {
    var returnErrorUrl = 'http://return.error/',
      searchString = '',
      wget = 'wget -nv -O- ',
      fakeExec = function (command, callback) {
        var actualCommand = command.slice(0, 13),
          url = command.slice(13);

        if (actualCommand !== wget) {
          return callback('Unexpected invocation');
        }

        if (url === returnErrorUrl) {
          return callback('This is an error');
        }

        return callback(null, url);
      },
      restoreExec = TorrentSiteManager.__set__('exec', fakeExec),

      parseTorrentDataStub = sinon.stub(),
      fakeTorrentSite = { url: 'replace-me', parseTorrentData: parseTorrentDataStub },

      testee = new TorrentSiteManager(testUtils.getFakeLog()),
      selectTorrentsStub = sinon.stub(testee, 'selectTorrents');


    beforeEach(function () {
      parseTorrentDataStub.reset();
      selectTorrentsStub.reset();
    });

    after(function () {
      restoreExec();
      selectTorrentsStub.restore();
    });

    it('should reject if the command failed', function (done) {
      fakeTorrentSite.url = returnErrorUrl;

      testee.tryTorrentSite(fakeTorrentSite, searchString, 12, 34, 'largest', 12)
        .fail(function (err) {
          expect(err).to.eql('This is an error');
          expect(parseTorrentDataStub.callCount).to.eql(0);
          expect(selectTorrentsStub.callCount).to.eql(0);
          done();
        });
    });

    it('should resolve if the command returns data', function (done) {
      fakeTorrentSite.url = 'http://foo.bar/';

      testee.tryTorrentSite(fakeTorrentSite, searchString, 12, 34, 'largest', 12)
        .then(function () {
          expect(parseTorrentDataStub.calledOnce).to.be.true;
          expect(parseTorrentDataStub.calledWithExactly(fakeTorrentSite.url, 12, 34)).to.be.true;

          expect(selectTorrentsStub.calledOnce).to.be.true;
          expect(selectTorrentsStub.calledWithExactly(undefined, 'largest', 12)).to.be.true;
          done();
        });
    });
  });

  describe('findTorrents', function () {
    var testee = new TorrentSiteManager(testUtils.getFakeLog()),
      tryTorrentSiteStub = sinon.stub(testee, 'tryTorrentSite'),

      searchString = 'foobar',
      seasonToCheck = 12,
      episodeToCheck = 34,
      torrentSort = 'asdf',
      maxTorrentsPerEpisode = 56;

    beforeEach(function () {
      tryTorrentSiteStub.reset();
    });

    after(function () {
      tryTorrentSiteStub.restore();
    });

    it('should fail if the only site has no torrents', function (done) {
      // our testee should think it has 1 torrent site...
      testee.allSites = ['foo'];

      // ... and that site should fail
      tryTorrentSiteStub.returns(Q.promise((resolve, reject) => reject()));

      testee.findTorrents(searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode)
      .fail(function (err) {
        expect(tryTorrentSiteStub.calledOnce).to.be.true;
        expect(tryTorrentSiteStub.calledWith(testee.allSites[0], searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode)).to.be.true;

        expect(err.message).to.eql('Failed to fetch torrent data from all known sites');

        done();
      });
    });

    it('should fail if all sites have no torrents', function (done) {
      // our testee should think it has 2 torrent sites...
      testee.allSites = ['foo', 'bar'];

      // ... and those sites should fail
      tryTorrentSiteStub.returns(Q.promise((resolve, reject) => reject()));

      testee.findTorrents(searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode)
      .fail(function (err) {
        expect(tryTorrentSiteStub.calledTwice).to.be.true;
        expect(tryTorrentSiteStub.firstCall.args).to.eql([testee.allSites[0], searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode]);
        expect(tryTorrentSiteStub.secondCall.args).to.eql([testee.allSites[1], searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode]);

        expect(err.message).to.eql('Failed to fetch torrent data from all known sites');

        done();
      });
    });

    it('should resolve if the only site has torrents', function (done) {
      // our testee should think it has 1 torrent site...
      var fakeTorrent = {foo: 'bar'};

      testee.allSites = ['foo'];

      // ... and that site should return a fake torrent
      tryTorrentSiteStub.returns(Q.promise((resolve, reject) => resolve(fakeTorrent)));

      testee.findTorrents(searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode)
      .then(function (torrents) {
        expect(tryTorrentSiteStub.calledOnce).to.be.true;
        expect(tryTorrentSiteStub.calledWith(testee.allSites[0], searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode)).to.be.true;

        expect(torrents).to.eql(fakeTorrent);

        done();
      });
    });

    it("should resolve if the second site has torrents but the first one doesn't", function (done) {
      // our testee should think it has 2 torrent sites...
      var fakeTorrent = {foo: 'bar'};

      testee.allSites = ['foo', 'bar'];

      // ... and the first site should fail but the second should return a fake torrent
      tryTorrentSiteStub.withArgs(testee.allSites[0]).returns(Q.promise((resolve, reject) => reject()));
      tryTorrentSiteStub.withArgs(testee.allSites[1]).returns(Q.promise((resolve, reject) => resolve(fakeTorrent)));

      testee.findTorrents(searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode)
      .then(function (torrents) {
        expect(tryTorrentSiteStub.calledTwice).to.be.true;
        expect(tryTorrentSiteStub.calledWith(testee.allSites[0], searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode)).to.be.true;
        expect(tryTorrentSiteStub.calledWith(testee.allSites[1], searchString, seasonToCheck, episodeToCheck, torrentSort, maxTorrentsPerEpisode)).to.be.true;

        expect(torrents).to.eql(fakeTorrent);

        done();
      });
    });
  });
});

