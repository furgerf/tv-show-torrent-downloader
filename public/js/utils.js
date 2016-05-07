
/*global app*/

(function (window) {

  function Utils() {
    this.setCookie = function (key, value, expirationDays) {
      expirationDays = expirationDays || 365;

      var d = new Date();
      d.setTime(d.getTime() + (expirationDays*24*60*60*1000));
      var expires = "expires="+d.toUTCString();

      document.cookie = key + "=" + value + "; " + expires;
    };

    this.getCookie = function (key) {
      var key = key + "=";
      var ca = document.cookie.split(';');
      for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(key) == 0) {
          return c.substring(key.length, c.length);
        }
      }
      return "";
    }
  };

  // Export to window
  window.app = window.app || {};
  window.app.Utils = Utils;
}(window));

