'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  sinon = require('sinon'),
  rewire = require('rewire'),
  Q = require('q'),

  App = require(root + 'app'),
  config = require(root + 'common/config').getDebugConfig(),
  utils = require('../../../src/common/utils'),
  testUtils = require('../../test-utils'),
  Subscription = require(root + 'database/subscription'),
  TorrentSiteManager = rewire(root + 'torrent-sites/torrentSiteManager'),
  RewiredFindSubscriptionUpdatesHandler = rewire(root + 'handlers/subscriptions/findSubscriptionUpdatesHandler');

config.api.port = 0;

describe('FindSubscriptionUpdatesHandler', function () {
  describe('getTorrentSort', function () {
    var getTorrentSort = RewiredFindSubscriptionUpdatesHandler.__get__('getTorrentSort'),
      validTorrentSorts = ['Largest', 'smALLest', 'newest', 'OLDEST', 'MostSeeded'];

    it('should return the default sort if no valid string is provided', function () {
      // TODO: Extract DEFAULT_SORT from actual function if possible
      var defaultSort = 'largest';

      expect(getTorrentSort()).to.eql(defaultSort);
      expect(getTorrentSort(123)).to.eql(defaultSort);
      expect(getTorrentSort({})).to.eql(defaultSort);
      expect(getTorrentSort([])).to.eql(defaultSort);
      expect(getTorrentSort('this is no valid torrent sort')).to.eql(defaultSort);
    });

    it('should accept the different valid torrent sorts', function () {
      validTorrentSorts.forEach(sort => expect(getTorrentSort(sort)).to.eql(sort.toLowerCase()));
    });

    it('should only accept torrent sorts that are also accepted by the TorrentSiteManager', function () {
      // add an invalid torrent sort
      validTorrentSorts.push('this is no a valid torrent sort');
      var compareTorrents = TorrentSiteManager.__get__('compareTorrents');
      validTorrentSorts.forEach(sort => compareTorrents({}, {}, getTorrentSort(sort)));
    });
  });

  describe('checkForMultipleEpisodes', function () {
    it('should reject invalid input');

    it('should return if no torrents are found');

    it('should return one torrent if only one torrent is found');

    it('should return multiple torrents if only several torrents are found');
  });

  describe('checkSubscriptionForUpdate', function () {
    it('should reject invalid input');

    it('should check for updates of same and of next season');
  });

  describe('requests', function () {
    // prepare sample data
    var sampleSubscriptions = testUtils.getSampleSubscriptionData().map(sub => new Subscription(sub)),

      unknownSubscriptionName = 'unknown show name',
      subscriptionWithNoUpdates = sampleSubscriptions[0],
      subscriptionWithUpdatesOfSameSeason = sampleSubscriptions[1],
      subscriptionWithUpdatesOfNextSeason = sampleSubscriptions[2],
      subscriptionWithUpdateOfSameAndNextSeasons = sampleSubscriptions[3],

      server,
      app,

      uploadDate = new Date(),
      fakeParser = {
        url: 'URL',
        parseTorrentData: function (html, season, episode) {
          return html ? html.map(function (h) {
            return {
              name: h,
              season: season,
              episode: episode,
              seeders: 12,
              leechers: 23,
              size: 34,
              uploadDate: uploadDate.toString(),
              link: h + ' - ' + season + ' - ' + episode
            };
          }) : [];
        }
      },

      wgetBaseCommand = 'wget -nv -O-',
      getWgetCommand = function (subscription, season, episode) {
        return wgetBaseCommand + ' ' + encodeURI(fakeParser.url + subscription.name + ' ' +
          utils.formatEpisodeNumber(season, episode) + ' ' + subscription.searchParameters);
      },

      modifiedTorrentSiteManager,
      findSubscriptionByNameStub,
      torrentSiteManagerExecStub,
      fakeUpdateSubscription = {
        downloadTorrent: sinon.stub()
      },
      restoreUpdateSubscription,
      restoreTorrentSiteManagerExec;

    before(function () {
      findSubscriptionByNameStub = sinon.stub(Subscription, 'findSubscriptionByName');

      torrentSiteManagerExecStub = sinon.stub();

      restoreTorrentSiteManagerExec = TorrentSiteManager.__set__('exec', torrentSiteManagerExecStub);

      modifiedTorrentSiteManager = new TorrentSiteManager(testUtils.getFakeLog());
      modifiedTorrentSiteManager.allSites = [ fakeParser ];
    });

    beforeEach(function (done) {
      var rewiredHandler;

      // reset stubs
      findSubscriptionByNameStub.reset();
      torrentSiteManagerExecStub.reset();

      // prepare app
      app = new App(config, testUtils.getFakeLog());
      restoreUpdateSubscription = RewiredFindSubscriptionUpdatesHandler.__set__('UpdateSubscription', fakeUpdateSubscription);
      rewiredHandler = new RewiredFindSubscriptionUpdatesHandler(modifiedTorrentSiteManager, testUtils.getFakeLog());
      app.findSubscriptionUpdatesHandler = rewiredHandler;

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

    after(function () {
      findSubscriptionByNameStub.restore();
      restoreTorrentSiteManagerExec();
      restoreUpdateSubscription();
    });

    describe('PUT /subscriptions/:subscriptionName/find', function () {
      it('should correctly handle unknown subscriptions', function (done) {
        findSubscriptionByNameStub.withArgs(unknownSubscriptionName).returns(Q.fcall(() => null));

        server
          .put('/subscriptions/' + unknownSubscriptionName + '/find')
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('BadRequestError');
            expect(res.body.message).to.equal("No subscription with name '" + unknownSubscriptionName + "'.");
            expect(res.body.data).to.not.exist;

            expect(findSubscriptionByNameStub.calledOnce);
            expect(findSubscriptionByNameStub.calledWith(unknownSubscriptionName));
            expect(torrentSiteManagerExecStub.notCalled);

            done();
          });
      });

      it('should successfully check for updates of a subscription that has no updates', function (done) {
        var currentSeasonCommand = getWgetCommand(subscriptionWithNoUpdates, subscriptionWithNoUpdates.lastSeason, subscriptionWithNoUpdates.lastEpisode + 1),
          nextSeasonCommand = getWgetCommand(subscriptionWithNoUpdates, subscriptionWithNoUpdates.lastSeason + 1, 1);

        // find subscription with the expected name should return the corresponding subscription
        findSubscriptionByNameStub.withArgs(subscriptionWithNoUpdates.name).returns(Q.fcall(() => subscriptionWithNoUpdates));

        // neither current season nor next season should return any torrent
        torrentSiteManagerExecStub.withArgs(currentSeasonCommand, sinon.match.func).callsArgWith(1, null, null);
        torrentSiteManagerExecStub.withArgs(nextSeasonCommand, sinon.match.func).callsArgWith(1, null, null);

        server
          .put('/subscriptions/' + subscriptionWithNoUpdates.name + '/find')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql([]);
            expect(res.body.message).to.equal('Found 0 new torrents');

            expect(findSubscriptionByNameStub.calledOnce);
            expect(findSubscriptionByNameStub.calledWith(subscriptionWithNoUpdates.name));

            // we expect 2 calls: one for the same season update check and one for the new season update check
            expect(torrentSiteManagerExecStub.calledTwice);

            expect(fakeUpdateSubscription.downloadTorrent.notCalled);

            done();
          });
      });

      it('should successfully start torrents of updates that are found of the same season', function (done) {
        var currentSeasonCommand1 = getWgetCommand(subscriptionWithUpdatesOfSameSeason, subscriptionWithUpdatesOfSameSeason.lastSeason, subscriptionWithUpdatesOfSameSeason.lastEpisode + 1),
          currentSeasonCommand2 = getWgetCommand(subscriptionWithUpdatesOfSameSeason, subscriptionWithUpdatesOfSameSeason.lastSeason, subscriptionWithUpdatesOfSameSeason.lastEpisode + 2),
          nextSeasonCommand = getWgetCommand(subscriptionWithUpdatesOfSameSeason, subscriptionWithUpdatesOfSameSeason.lastSeason + 1, 1),
          dummyTorrentResult = ['asdf'];

        // find subscription with the expected name should return the corresponding subscription
        findSubscriptionByNameStub.withArgs(subscriptionWithUpdatesOfSameSeason.name).returns(Q.fcall(() => subscriptionWithUpdatesOfSameSeason));

        // neither current season nor next season should return any torrent
        torrentSiteManagerExecStub.withArgs(currentSeasonCommand1, sinon.match.func).callsArgWith(1, null, dummyTorrentResult);
        torrentSiteManagerExecStub.withArgs(currentSeasonCommand2, sinon.match.func).callsArgWith(1, null, null);
        torrentSiteManagerExecStub.withArgs(nextSeasonCommand, sinon.match.func).callsArgWith(1, null, null);

        server
          .put('/subscriptions/' + subscriptionWithUpdatesOfSameSeason.name + '/find?startDownload=true')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            var torrentSeason = subscriptionWithUpdatesOfSameSeason.lastSeason,
              torrentEpisode = subscriptionWithUpdatesOfSameSeason.lastEpisode + 1;

            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql(fakeParser.parseTorrentData(dummyTorrentResult, subscriptionWithUpdatesOfSameSeason.lastSeason, subscriptionWithUpdatesOfSameSeason.lastEpisode + 1));
            expect(res.body.message).to.equal('Found and started download of 1 new torrents');

            expect(findSubscriptionByNameStub.calledOnce);
            expect(findSubscriptionByNameStub.calledWith(subscriptionWithUpdatesOfSameSeason.name));

            // we expect 3 calls: two for the same season update check and one for the new season update check
            expect(torrentSiteManagerExecStub.calledThrice);

            expect(fakeUpdateSubscription.downloadTorrent.calledOnce);
            expect(fakeUpdateSubscription.downloadTorrent.calledWith(subscriptionWithUpdatesOfSameSeason, torrentSeason, torrentEpisode, dummyTorrentResult[0] + ' - ' + torrentSeason + ' - ' + torrentEpisode, sinon.match.object));

            done();
          });
      });

      it('should successfully check for updates and select according to the request of a subscription that has updates of the next season', function (done) {
        var currentSeasonCommand = getWgetCommand(subscriptionWithUpdatesOfNextSeason, subscriptionWithUpdatesOfNextSeason.lastSeason, subscriptionWithUpdatesOfNextSeason.lastEpisode + 1),
          nextSeasonCommand1 = getWgetCommand(subscriptionWithUpdatesOfNextSeason, subscriptionWithUpdatesOfNextSeason.lastSeason + 1, 1),
          nextSeasonCommand2 = getWgetCommand(subscriptionWithUpdatesOfNextSeason, subscriptionWithUpdatesOfNextSeason.lastSeason + 1, 2),
          dummyTorrentResult = ['foo', 'bar'];

        // find subscription with the expected name should return the corresponding subscription
        findSubscriptionByNameStub.withArgs(subscriptionWithUpdatesOfNextSeason.name).returns(Q.fcall(() => subscriptionWithUpdatesOfNextSeason));

        // neither current season nor next season should return any torrent
        torrentSiteManagerExecStub.withArgs(currentSeasonCommand, sinon.match.func).callsArgWith(1, null, null);
        torrentSiteManagerExecStub.withArgs(nextSeasonCommand1, sinon.match.func).callsArgWith(1, null, dummyTorrentResult);
        torrentSiteManagerExecStub.withArgs(nextSeasonCommand2, sinon.match.func).callsArgWith(1, null, null);

        server
          .put('/subscriptions/' + subscriptionWithUpdatesOfNextSeason.name + '/find?torrentSort=newest&maxTorrentsPerEpisode=1')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            // note that with the current fake torrent parser, it's not really possible to create torrents where it makes sense to sort
            var expectedTorrent = fakeParser.parseTorrentData(dummyTorrentResult, subscriptionWithUpdatesOfNextSeason.lastSeason + 1, 1)[0];

            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql([expectedTorrent]);
            expect(res.body.message).to.equal('Found 1 new torrents');

            expect(findSubscriptionByNameStub.calledOnce);
            expect(findSubscriptionByNameStub.calledWith(subscriptionWithUpdatesOfNextSeason.name));

            // we expect 3 calls: two for the same season update check and one for the new season update check
            expect(torrentSiteManagerExecStub.calledThrice);

            expect(fakeUpdateSubscription.downloadTorrent.notCalled);

            done();
          });
      });

      it('should successfully check for updates of a subscription that has updates of both same and next season');
    });

    describe('PUT /subscriptions/find', function () {
      it('should successfully check for all updates tested separately before');
    });
  });
});

