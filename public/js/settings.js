
/*global app*/

(function (window) {

  function Settings(utils) {
    const ServerHostCookieKey = 'serverHost',
          ServerPortCookieKey = 'serverPort';

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
  };

  // Export to window
  window.app = window.app || {};
  window.app.Settings = Settings;
}(window));

