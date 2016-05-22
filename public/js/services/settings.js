
/*global app*/

(function (window) {

  function Settings(utils) {
    const ServerHostCookieKey = 'serverHost',
          ServerPortCookieKey = 'serverPort',
          TorrentSortKey = 'torrentSort',
          MaxTorrentsPerEpisodeKey = 'maxTorrentsPerEpisode';

    this.getServerHost = function () {
      return utils.getCookie(ServerHostCookieKey);
    };
    this.setServerHost = function (newHost) {
      return utils.setCookie(ServerHostCookieKey, newHost);
    };

    this.getServerPort = function () {
      return utils.getCookie(ServerPortCookieKey);
    };
    this.setServerPort = function (newPort) {
      return utils.setCookie(ServerPortCookieKey, newPort);
    };

    this.getServerAddress = function () {
      return 'http://' + this.getServerHost() + ':' + this.getServerPort();
    };

    this.getTorrentSort = function () {
      return utils.getCookie(TorrentSortKey);
    };
    this.setTorrentSort = function (torrentSort) {
      return utils.setCookie(TorrentSortKey, torrentSort);
    };

    this.getMaxTorrentsPerEpisode = function () {
      return utils.getCookie(MaxTorrentsPerEpisodeKey);
    };
    this.setMaxTorrentsPerEpisode = function (maxTorrents) {
      return utils.setCookie(MaxTorrentsPerEpisodeKey, maxTorrents);
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.Settings = Settings;
}(window));

