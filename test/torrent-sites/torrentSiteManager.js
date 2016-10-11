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
    before(function () {
      var now = new Date(),
        before = new Date();
      before = before.setHours(before.getHours() - 1);

      this.compareTorrents = TorrentSiteManager.__get__('compareTorrents');

      this.torrent1 =
        {
          name: 'asdf',
          season: 12,
          episode: 34,
          seeders: 56,
          leechers: 78,
          size: 12345,
          uploadDate: now,
          link: 'http://asdf.com'
        };
      this.torrent2 =
        {
          name: 'foobar',
          season: 23,
          episode: 45,
          seeders: 67,
          leechers: 89,
          size: 123456,
          uploadDate: before,
          link: 'http://foobar.com'
        };
    });

    it('should raise an exception on invalid arguments');

    it('should raise an exception on unknown sort order');

    it('should correctly sort by size', function () {
      expect(this.compareTorrents(this.torrent1, this.torrent2, 'largest')).to.be.true;
      expect(this.compareTorrents(this.torrent1, this.torrent2, 'smallest')).to.be.false;
      expect(this.compareTorrents(this.torrent2, this.torrent1, 'largest')).to.be.false;
      expect(this.compareTorrents(this.torrent2, this.torrent1, 'smallest')).to.be.true;

      expect(this.compareTorrents(this.torrent1, this.torrent1, 'largest')).to.be.false;
      expect(this.compareTorrents(this.torrent1, this.torrent1, 'smallest')).to.be.false;
    });

    it('should correctly sort by date', function () {
      expect(this.compareTorrents(this.torrent1, this.torrent2, 'oldest')).to.be.true;
      expect(this.compareTorrents(this.torrent1, this.torrent2, 'newest')).to.be.false;
      expect(this.compareTorrents(this.torrent2, this.torrent1, 'oldest')).to.be.false;
      expect(this.compareTorrents(this.torrent2, this.torrent1, 'newest')).to.be.true;

      expect(this.compareTorrents(this.torrent1, this.torrent1, 'oldest')).to.be.false;
      expect(this.compareTorrents(this.torrent1, this.torrent1, 'newest')).to.be.false;
    });

    it('should correctly sort by seeds', function () {
      expect(this.compareTorrents(this.torrent1, this.torrent2, 'mostseeded')).to.be.true;
      expect(this.compareTorrents(this.torrent2, this.torrent1, 'mostseeded')).to.be.false;

      expect(this.compareTorrents(this.torrent1, this.torrent1, 'mostseeded')).to.be.false;
    });
  });

  describe('selectTorrents', function () {
    it('should reject invalid input');

    it('should manage to return if no torrents are found');

    it('should select no more than the number of torrents that are expected');

    it('should correctly select torrents based the provided criterion');
  });

  describe('tryTorrentSite', function () {
    it('should reject invalid input');

    it('should reject if the command failed');

    it('should resolve if the command returns data');
  });

  describe('findTorrents', function () {
    before(function () {
      this.tryTorrentSiteStub = sinon.stub();
      TorrentSiteManager.__set__('tryTorrentSite', this.tryTorrentSiteStub);

      this.testee = new TorrentSiteManager(testUtils.getFakeLog());

      this.searchString = 'foobar';
      this.seasonToCheck = 12;
      this.episodeToCheck = 34;
      this.torrentSort = 'asdf';
      this.maxTorrentsPerEpisode = 56;
    });

    beforeEach(function () {
      this.tryTorrentSiteStub.reset();
    });

    it('should reject invalid input');

    it('should fail if the only site has no torrents', function (done) {
      var that = this;

      // our testee should think it has 1 torrent site...
      this.testee.allSites = ['foo'];

      // ... and that site should fail
      this.tryTorrentSiteStub.returns(Q.promise((resolve, reject) => reject()));

      this.testee.findTorrents(this.searchString, this.seasonToCheck, this.episodeToCheck, this.torrentSort, this.maxTorrentsPerEpisode)
      .fail(function (err) {
        expect(that.tryTorrentSiteStub.calledOnce).to.be.true;
        expect(that.tryTorrentSiteStub.calledWith(that.testee.allSites[0], that.searchString, that.seasonToCheck, that.episodeToCheck, that.torrentSort, that.maxTorrentsPerEpisode)).to.be.true;

        expect(err.message).to.eql('Failed to fetch torrent data from all known sites');

        done();
      });
    });

    it('should fail if all sites have no torrents', function (done) {
      var that = this;

      // our testee should think it has 2 torrent sites...
      this.testee.allSites = ['foo', 'bar'];

      // ... and those sites should fail
      this.tryTorrentSiteStub.returns(Q.promise((resolve, reject) => reject()));

      this.testee.findTorrents(this.searchString, this.seasonToCheck, this.episodeToCheck, this.torrentSort, this.maxTorrentsPerEpisode)
      .fail(function (err) {
        expect(that.tryTorrentSiteStub.calledTwice).to.be.true;
        expect(that.tryTorrentSiteStub.firstCall.args).to.eql([that.testee.allSites[0], that.searchString, that.seasonToCheck, that.episodeToCheck, that.torrentSort, that.maxTorrentsPerEpisode]);
        expect(that.tryTorrentSiteStub.secondCall.args).to.eql([that.testee.allSites[1], that.searchString, that.seasonToCheck, that.episodeToCheck, that.torrentSort, that.maxTorrentsPerEpisode]);

        expect(err.message).to.eql('Failed to fetch torrent data from all known sites');

        done();
      });
    });

    it('should resolve if the only site has torrents', function (done) {
      var that = this;

      // our testee should think it has 1 torrent site...
      this.testee.allSites = ['foo'];
      this.fakeTorrent = {foo: 'bar'};

      // ... and that site should return a fake torrent
      this.tryTorrentSiteStub.returns(Q.promise((resolve, reject) => resolve(this.fakeTorrent)));

      this.testee.findTorrents(this.searchString, this.seasonToCheck, this.episodeToCheck, this.torrentSort, this.maxTorrentsPerEpisode)
      .then(function (torrents) {
        expect(that.tryTorrentSiteStub.calledOnce).to.be.true;
        expect(that.tryTorrentSiteStub.calledWith(that.testee.allSites[0], that.searchString, that.seasonToCheck, that.episodeToCheck, that.torrentSort, that.maxTorrentsPerEpisode)).to.be.true;

        expect(torrents).to.eql(that.fakeTorrent);

        done();
      });
    });

    it("should resolve if the second site has torrents but the first one doesn't", function (done) {
      var that = this;

      // our testee should think it has 2 torrent sites...
      this.testee.allSites = ['foo', 'bar'];
      this.fakeTorrent = {foo: 'bar'};

      // ... and the first site should fail but the second should return a fake torrent
      this.tryTorrentSiteStub.withArgs(this.testee.allSites[0]).returns(Q.promise((resolve, reject) => reject()));
      this.tryTorrentSiteStub.withArgs(this.testee.allSites[1]).returns(Q.promise((resolve, reject) => resolve(this.fakeTorrent)));

      this.testee.findTorrents(this.searchString, this.seasonToCheck, this.episodeToCheck, this.torrentSort, this.maxTorrentsPerEpisode)
      .then(function (torrents) {
        expect(that.tryTorrentSiteStub.calledTwice).to.be.true;
        expect(that.tryTorrentSiteStub.calledWith(that.testee.allSites[0], that.searchString, that.seasonToCheck, that.episodeToCheck, that.torrentSort, that.maxTorrentsPerEpisode)).to.be.true;
        expect(that.tryTorrentSiteStub.calledWith(that.testee.allSites[1], that.searchString, that.seasonToCheck, that.episodeToCheck, that.torrentSort, that.maxTorrentsPerEpisode)).to.be.true;

        expect(torrents).to.eql(that.fakeTorrent);

        done();
      });
    });
  });
});

