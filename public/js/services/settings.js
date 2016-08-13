
/*global app*/

(function (window) {

  function Settings(utils) {
    const SubscriptionSortKey = 'subscriptionSort',
          ServerHostCookieKey = 'serverHost',
          ServerPortCookieKey = 'serverPort',
          TorrentSortKey = 'torrentSort',
          MaxTorrentsPerEpisodeKey = 'maxTorrentsPerEpisode',

          defaultSubscriptionSort = 'alphabetical',
          defaultServerHost = 'localhost',
          defaultServerPort = 8000,
          defaultTorrentSort = 'largest',
          defaultMaxTorrentsPerEpisode = 2;

    this.getSubscriptionSort = function () {
      return utils.getCookie(SubscriptionSortKey) || defaultSubscriptionSort;
    };
    this.setSubscriptionSort = function (torrentSort) {
      return utils.setCookie(SubscriptionSortKey, torrentSort);
    };

    this.getServerHost = function () {
      return utils.getCookie(ServerHostCookieKey) || defaultServerHost;
    };
    this.setServerHost = function (newHost) {
      return utils.setCookie(ServerHostCookieKey, newHost);
    };

    this.getServerPort = function () {
      return utils.getCookie(ServerPortCookieKey) || defaultServerPort;
    };
    this.setServerPort = function (newPort) {
      return utils.setCookie(ServerPortCookieKey, newPort);
    };

    this.getServerAddress = function () {
      return 'http://' + this.getServerHost() + ':' + this.getServerPort();
    };

    this.getTorrentSort = function () {
      return utils.getCookie(TorrentSortKey) || defaultTorrentSort;
    };
    this.setTorrentSort = function (torrentSort) {
      return utils.setCookie(TorrentSortKey, torrentSort);
    };

    this.getMaxTorrentsPerEpisode = function () {
      return utils.getCookie(MaxTorrentsPerEpisodeKey) || defaultMaxTorrentsPerEpisode;
    };
    this.setMaxTorrentsPerEpisode = function (maxTorrents) {
      return utils.setCookie(MaxTorrentsPerEpisodeKey, maxTorrents);
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.Settings = Settings;
}(window));

