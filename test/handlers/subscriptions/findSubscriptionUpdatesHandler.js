'use strict';

const root = './../../../src/';

var expect = require('chai').expect,
  supertest = require('supertest'),
  rewire = require('rewire'),

  App = require(root + 'app').App,
  config = require(root + 'common/config').getDebugConfig(),
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
      fakeSubscription = testUtils.getFakeStaticSubscription(Subscription, sampleSubscriptions),

      server,
      app,

      subscriptionNameWithNoUpdates = sampleSubscriptions[0].name,
      subscriptionNameWithUpdatesOfSameSeason = sampleSubscriptions[1].name,
      subscriptionNameWithUpdatesOfNextSeason = sampleSubscriptions[2].name,
      subscriptionNameWithUpdateOfSameAndNextSeasons = sampleSubscriptions[3].name,

      fakeParser = {
        url: '',
        parseTorrentData: function (html, season, episode) {
          return [{
            name: html,
            season: season,
            episode: episode,
            seeders: 12,
            leechers: 23,
            size: 34,
            uploadDate: new Date(),
            link: html + ' - ' + season + ' - ' + episode
          }];
        }
      },
      returnErrorUrl = 'return error',
      throwErrorUrl  = 'throw error',
      fakeExec = function (command, callback) {
        var actualCommand = command.slice(0, 13),
          url = command.slice(13);
        console.log(actualCommand);
        console.log(url);

        if (actualCommand !== 'wget -nv -O- ') {
          return callback('Unexpected invocation');
        }

        if (url === returnErrorUrl) {
          return callback('This is an error');
        }

        if (url === throwErrorUrl) {
          throw new Error('Fake exec failed!');
        }

        return callback(null, url);
      };

    // injec fake exec
    TorrentSiteManager.__set__('exec', fakeExec);

    fakeSubscription.Subscription.initialize(testUtils.getFakeLog());

    beforeEach(function (done) {
      var torrentSiteManager;

      // reset stubs
      fakeSubscription.findStub.reset();
      fakeSubscription.skipStub.reset();
      fakeSubscription.limitStub.reset();
      fakeSubscription.findOneStub.reset();

      // prepare app
      app = new App(config, testUtils.getFakeLog());

      RewiredFindSubscriptionUpdatesHandler.__set__('Subscription', fakeSubscription.Subscription);
      torrentSiteManager = new TorrentSiteManager(testUtils.getFakeLog());
      torrentSiteManager.allSites = [fakeParser];
      app.findSubscriptionUpdatesHandler = new RewiredFindSubscriptionUpdatesHandler(torrentSiteManager, testUtils.getFakeLog());

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

    describe('PUT /subscriptions/:subscriptionName/find', function () {
      it('should correctly handle unknown subscriptions', function (done) {
        server
          .put('/subscriptions/asdf/find')
          .expect('Content-type', 'application/json')
          .expect(400)
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res.result).to.not.exist;
            expect(res.body.code).to.equal('BadRequestError');
            expect(res.body.message).to.equal('No subscription with name \'asdf\'.');
            expect(res.body.data).to.not.exist;
            done();
          });
      });

      it('should successfully check for updates of a subscription that has no updates');

      it('should successfully check for updates of a subscription that has updates of the same season');

      it('should successfully check for updates of a subscription that has updates of the next season');

      it('should successfully check for updates of a subscription that has updates of both same and next season');
    });

    describe('PUT /subscriptions/find', function () {
      it('should successfully check for all updates tested separately before');
    });
  });
});

