/*global app*/

(function (window) {
  'use strict';

  function Show(name, downloadedEpisode, availableEpisode, lastUpdatecheck) {
    this.name = name;
    this.downloadedEpisode = downloadedEpisode;
    this.availableEpisode = availableEpisode;
    this.lastUpdateCheck = lastUpdatecheck;
  }

  // export to window
  window.app = window.app || {};
  window.app.Show = Show;
}(window));
