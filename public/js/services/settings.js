
/*global app*/

(function (window) {

  function Settings(utils, notification) {
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

    function showNotification(settingName, newValue) {
      notification.show('Set ' + settingName + ' to `' + newValue + '`');
    }

    this.getSubscriptionSort = function () {
      return utils.getCookie(SubscriptionSortKey) || defaultSubscriptionSort;
    };
    this.setSubscriptionSort = function (newSubscriptionSort) {
      utils.setCookie(SubscriptionSortKey, newSubscriptionSort);
      showNotification('subscription sorting', newSubscriptionSort);
    };

    this.getServerHost = function () {
      return utils.getCookie(ServerHostCookieKey) || defaultServerHost;
    };
    this.setServerHost = function (newHost) {
      utils.setCookie(ServerHostCookieKey, newHost);
      showNotification('server host', newHost);
    };

    this.getServerPort = function () {
      return utils.getCookie(ServerPortCookieKey) || defaultServerPort;
    };
    this.setServerPort = function (newPort) {
      utils.setCookie(ServerPortCookieKey, newPort);
      showNotification('server port', newPort);
    };

    this.getServerAddress = function () {
      return 'http://' + this.getServerHost() + ':' + this.getServerPort();
    };

    this.getTorrentSort = function () {
      return utils.getCookie(TorrentSortKey) || defaultTorrentSort;
    };
    this.setTorrentSort = function (newTorrentSort) {
      utils.setCookie(TorrentSortKey, newTorrentSort);
      showNotification('torrent sorting', newTorrentSort);
    };

    this.getMaxTorrentsPerEpisode = function () {
      return utils.getCookie(MaxTorrentsPerEpisodeKey) || defaultMaxTorrentsPerEpisode;
    };
    this.setMaxTorrentsPerEpisode = function (newMaxTorrents) {
      utils.setCookie(MaxTorrentsPerEpisodeKey, newMaxTorrents);
      showNotification('max torrents', newMaxTorrents);
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.Settings = Settings;
}(window));

