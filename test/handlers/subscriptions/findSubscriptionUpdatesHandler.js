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
      subscriptionWithUpdatesOfSameAndNextSeason = sampleSubscriptions[3],

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
      findAllSubscriptionsStub,
      torrentSiteManagerExecStub,
      fakeUpdateSubscription = {
        downloadTorrent: sinon.stub()
      },
      restoreUpdateSubscription,
      restoreTorrentSiteManagerExec,

      // set up dummy torrent results
      subscriptionWithUpdatesOfSameSeasonDummyData = [
        ['asdf']
      ],
      subscriptionWithUpdatesOfSameSeasonDummyTorrents = [
        fakeParser.parseTorrentData(subscriptionWithUpdatesOfSameSeasonDummyData[0], subscriptionWithUpdatesOfSameSeason.lastSeason, subscriptionWithUpdatesOfSameSeason.lastEpisode + 1)
      ],
      subscriptionWithUpdatesOfNextSeasonDummyData = [
        ['foo', 'bar']
      ],
      subscriptionWithUpdatesOfNextSeasonDummyTorrents = [
        fakeParser.parseTorrentData(subscriptionWithUpdatesOfNextSeasonDummyData[0], subscriptionWithUpdatesOfNextSeason.lastSeason + 1, 1)
      ],
      subscriptionWithUpdatesOfSameAndNextSeasonDummyData = [
        ['foobar'],
        ['asdf'],
        ['foo', 'bar']
      ],
      subscriptionWithUpdatesOfSameAndNextSeasonDummyTorrents = [].concat.apply([], [
        fakeParser.parseTorrentData(subscriptionWithUpdatesOfSameAndNextSeasonDummyData[0], subscriptionWithUpdatesOfSameAndNextSeason.lastSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastEpisode + 1),
        fakeParser.parseTorrentData(subscriptionWithUpdatesOfSameAndNextSeasonDummyData[1], subscriptionWithUpdatesOfSameAndNextSeason.lastSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastEpisode + 2),
        fakeParser.parseTorrentData(subscriptionWithUpdatesOfSameAndNextSeasonDummyData[2], subscriptionWithUpdatesOfSameAndNextSeason.lastSeason + 1, 1),
      ]),

      // construct expected wget commands
      subscriptionWithNoUpdatesCommands = [
        getWgetCommand(subscriptionWithNoUpdates, subscriptionWithNoUpdates.lastSeason, subscriptionWithNoUpdates.lastEpisode + 1),
        getWgetCommand(subscriptionWithNoUpdates, subscriptionWithNoUpdates.lastSeason + 1, 1)
      ],
      subscriptionWithUpdatesOfSameSeasonCommands = [
        getWgetCommand(subscriptionWithUpdatesOfSameSeason, subscriptionWithUpdatesOfSameSeason.lastSeason, subscriptionWithUpdatesOfSameSeason.lastEpisode + 1),
        getWgetCommand(subscriptionWithUpdatesOfSameSeason, subscriptionWithUpdatesOfSameSeason.lastSeason, subscriptionWithUpdatesOfSameSeason.lastEpisode + 2),
        getWgetCommand(subscriptionWithUpdatesOfSameSeason, subscriptionWithUpdatesOfSameSeason.lastSeason + 1, 1)
      ],
      subscriptionWithUpdatesOfNextSeasonCommands = [
        getWgetCommand(subscriptionWithUpdatesOfNextSeason, subscriptionWithUpdatesOfNextSeason.lastSeason, subscriptionWithUpdatesOfNextSeason.lastEpisode + 1),
        getWgetCommand(subscriptionWithUpdatesOfNextSeason, subscriptionWithUpdatesOfNextSeason.lastSeason + 1, 1),
        getWgetCommand(subscriptionWithUpdatesOfNextSeason, subscriptionWithUpdatesOfNextSeason.lastSeason + 1, 2)
      ],
      subscriptionWithUpdatesOfSameAndNextSeasonCommands = [
         getWgetCommand(subscriptionWithUpdatesOfSameAndNextSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastEpisode + 1),
         getWgetCommand(subscriptionWithUpdatesOfSameAndNextSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastEpisode + 2),
         getWgetCommand(subscriptionWithUpdatesOfSameAndNextSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastEpisode + 3),
         getWgetCommand(subscriptionWithUpdatesOfSameAndNextSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastSeason + 1, 1),
         getWgetCommand(subscriptionWithUpdatesOfSameAndNextSeason, subscriptionWithUpdatesOfSameAndNextSeason.lastSeason + 1, 2)
      ];


    before(function () {
      // prepare stubs
      findSubscriptionByNameStub = sinon.stub(Subscription, 'findSubscriptionByName');
      findAllSubscriptionsStub = sinon.stub(Subscription, 'findAllSubscriptions');
      torrentSiteManagerExecStub = sinon.stub();
      restoreTorrentSiteManagerExec = TorrentSiteManager.__set__('exec', torrentSiteManagerExecStub);
      modifiedTorrentSiteManager = new TorrentSiteManager(testUtils.getFakeLog());
      modifiedTorrentSiteManager.allSites = [ fakeParser ];

      // set up stub responses
      findSubscriptionByNameStub.withArgs(unknownSubscriptionName).returns(Q.fcall(() => null));
      findSubscriptionByNameStub.withArgs(subscriptionWithNoUpdates.name).returns(Q.fcall(() => subscriptionWithNoUpdates));
      findSubscriptionByNameStub.withArgs(subscriptionWithUpdatesOfSameSeason.name).returns(Q.fcall(() => subscriptionWithUpdatesOfSameSeason));
      findSubscriptionByNameStub.withArgs(subscriptionWithUpdatesOfNextSeason.name).returns(Q.fcall(() => subscriptionWithUpdatesOfNextSeason));
      findSubscriptionByNameStub.withArgs(subscriptionWithUpdatesOfSameAndNextSeason.name).returns(Q.fcall(() => subscriptionWithUpdatesOfSameAndNextSeason));

      findAllSubscriptionsStub.returns(Q.fcall(() => [
        subscriptionWithNoUpdates,
        subscriptionWithUpdatesOfSameSeason,
        subscriptionWithUpdatesOfNextSeason,
        subscriptionWithUpdatesOfSameAndNextSeason
      ]));

      // set up wget responses
      torrentSiteManagerExecStub.withArgs(subscriptionWithNoUpdatesCommands[0], sinon.match.func).callsArgWith(1, null, null);
      torrentSiteManagerExecStub.withArgs(subscriptionWithNoUpdatesCommands[1], sinon.match.func).callsArgWith(1, null, null);

      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfSameSeasonCommands[0], sinon.match.func).callsArgWith(1, null, subscriptionWithUpdatesOfSameSeasonDummyData[0]);
      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfSameSeasonCommands[1], sinon.match.func).callsArgWith(1, null, null);
      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfSameSeasonCommands[2], sinon.match.func).callsArgWith(1, null, null);

      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfNextSeasonCommands[0], sinon.match.func).callsArgWith(1, null, null);
      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfNextSeasonCommands[1], sinon.match.func).callsArgWith(1, null, subscriptionWithUpdatesOfNextSeasonDummyData[0]);
      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfNextSeasonCommands[2], sinon.match.func).callsArgWith(1, null, null);


      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfSameAndNextSeasonCommands[0], sinon.match.func).callsArgWith(1, null, subscriptionWithUpdatesOfSameAndNextSeasonDummyData[0]);
      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfSameAndNextSeasonCommands[1], sinon.match.func).callsArgWith(1, null, subscriptionWithUpdatesOfSameAndNextSeasonDummyData[1]);
      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfSameAndNextSeasonCommands[2], sinon.match.func).callsArgWith(1, null, null);
      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfSameAndNextSeasonCommands[3], sinon.match.func).callsArgWith(1, null, subscriptionWithUpdatesOfSameAndNextSeasonDummyData[2]);
      torrentSiteManagerExecStub.withArgs(subscriptionWithUpdatesOfSameAndNextSeasonCommands[4], sinon.match.func).callsArgWith(1, null, null);
    });

    beforeEach(function (done) {
      var rewiredHandler;

      // reset stubs
      findSubscriptionByNameStub.reset();
      findAllSubscriptionsStub.reset();
      torrentSiteManagerExecStub.reset();
      fakeUpdateSubscription.downloadTorrent.reset();

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

            expect(findSubscriptionByNameStub.calledOnce).to.be.true;
            expect(findSubscriptionByNameStub.calledWith(unknownSubscriptionName)).to.be.true;

            expect(torrentSiteManagerExecStub.notCalled).to.be.true;

            expect(fakeUpdateSubscription.downloadTorrent.notCalled).to.be.true;

            done();
          });
      });

      it('should successfully check for updates of a subscription that has no updates', function (done) {
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

            expect(findSubscriptionByNameStub.calledOnce).to.be.true;
            expect(findSubscriptionByNameStub.calledWith(subscriptionWithNoUpdates.name)).to.be.true;

            // we expect 2 calls: one for the same season update check and one for the new season update check
            expect(torrentSiteManagerExecStub.calledTwice).to.be.true;
            subscriptionWithNoUpdatesCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);

            expect(fakeUpdateSubscription.downloadTorrent.notCalled);

            done();
          });
      });

      it('should successfully start torrents of updates that are found of the same season', function (done) {
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
            expect(res.body.data).to.eql(subscriptionWithUpdatesOfSameSeasonDummyTorrents[0]);
            expect(res.body.message).to.equal('Found and started download of 1 new torrents');

            expect(findSubscriptionByNameStub.calledOnce).to.be.true;
            expect(findSubscriptionByNameStub.calledWith(subscriptionWithUpdatesOfSameSeason.name)).to.be.true;

            // we expect 3 calls: two for the same season update check and one for the new season update check
            expect(torrentSiteManagerExecStub.calledThrice).to.be.true;
            subscriptionWithUpdatesOfSameSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);

            expect(fakeUpdateSubscription.downloadTorrent.calledOnce).to.be.true;
            expect(fakeUpdateSubscription.downloadTorrent.calledWith(subscriptionWithUpdatesOfSameSeason, torrentSeason, torrentEpisode, subscriptionWithUpdatesOfSameSeasonDummyData[0] + ' - ' + torrentSeason + ' - ' + torrentEpisode, sinon.match.object)).to.be.true;

            done();
          });
      });

      it('should successfully check for updates and select according to the request of a subscription that has updates of the next season', function (done) {
        server
          .put('/subscriptions/' + subscriptionWithUpdatesOfNextSeason.name + '/find?torrentSort=newest&maxTorrentsPerEpisode=1')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            // note that with the current fake torrent parser, it's not really possible to create torrents where it makes sense to sort

            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql([subscriptionWithUpdatesOfNextSeasonDummyTorrents[0][0]]);
            expect(res.body.message).to.equal('Found 1 new torrents');

            expect(findSubscriptionByNameStub.calledOnce).to.be.true;
            expect(findSubscriptionByNameStub.calledWith(subscriptionWithUpdatesOfNextSeason.name)).to.be.true;

            // we expect 3 calls: two for the same season update check and one for the new season update check
            expect(torrentSiteManagerExecStub.calledThrice).to.be.true;
            subscriptionWithUpdatesOfNextSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);

            expect(fakeUpdateSubscription.downloadTorrent.notCalled).to.be.true;

            done();
          });
      });

      it('should successfully check for updates of a subscription that has updates of both same and next season', function (done) {
        server
          .put('/subscriptions/' + subscriptionWithUpdatesOfSameAndNextSeason.name + '/find?maxTorrentsPerEpisode=2')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql(subscriptionWithUpdatesOfSameAndNextSeasonDummyTorrents);
            expect(res.body.message).to.equal('Found 4 new torrents');

            expect(findSubscriptionByNameStub.calledOnce).to.be.true;;
            expect(findSubscriptionByNameStub.calledWith(subscriptionWithUpdatesOfSameAndNextSeason.name)).to.be.true;

            // we expect 5 calls: three for the same season update check and two for the new season update check
            expect(torrentSiteManagerExecStub.callCount).to.eql(5);
            subscriptionWithUpdatesOfSameAndNextSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);

            expect(fakeUpdateSubscription.downloadTorrent.notCalled).to.be.true;;

            done();
          });
      });
    });

    describe('PUT /subscriptions/find', function () {
      it('should successfully check for all updates and return limited torrents', function (done) {
        server
          .put('/subscriptions/find')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            var expectedTorrents = [
              subscriptionWithUpdatesOfSameSeasonDummyTorrents[0],
              [subscriptionWithUpdatesOfNextSeasonDummyTorrents[0][0]],
              subscriptionWithUpdatesOfSameAndNextSeasonDummyTorrents.slice(0, 3)
            ];

            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql(expectedTorrents);
            expect(res.body.message).to.equal('Checked 4 subscriptions for updates and found 5 new torrents');

            expect(findAllSubscriptionsStub.calledOnce).to.be.true;

            expect(torrentSiteManagerExecStub.callCount).to.eql(13);
            subscriptionWithNoUpdatesCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);
            subscriptionWithUpdatesOfSameSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);
            subscriptionWithUpdatesOfNextSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);
            subscriptionWithUpdatesOfSameAndNextSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);

            expect(fakeUpdateSubscription.downloadTorrent.notCalled).to.be.true;

            done();
          });
      });

      it('should successfully check for all updates and start downloads', function (done) {
        server
          .put('/subscriptions/find?maxTorrentsPerEpisode=123&startDownload=true')
          .expect('Content-type', 'application/json')
          .expect(200)
          .end(function (err, res) {
            var expectedTorrents = [
              subscriptionWithUpdatesOfSameSeasonDummyTorrents[0],
              subscriptionWithUpdatesOfNextSeasonDummyTorrents[0],
              subscriptionWithUpdatesOfSameAndNextSeasonDummyTorrents
            ];

            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('Success');
            expect(res.body.data).to.eql(expectedTorrents);
            expect(res.body.message).to.equal('Checked 4 subscriptions for updates and found 7 new torrents which were downloaded');

            expect(findAllSubscriptionsStub.calledOnce).to.be.true;

            expect(torrentSiteManagerExecStub.callCount).to.eql(13);
            subscriptionWithNoUpdatesCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);
            subscriptionWithUpdatesOfSameSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);
            subscriptionWithUpdatesOfNextSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);
            subscriptionWithUpdatesOfSameAndNextSeasonCommands.forEach(cmd => expect(torrentSiteManagerExecStub.calledWith(cmd, sinon.match.func)).to.be.true);

            expect(fakeUpdateSubscription.downloadTorrent.callCount).to.eql(7);
            // can't be bothered to try and list all those calls...

            done();
          });
      });
    });
  });
});

