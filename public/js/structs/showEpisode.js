/*global app*/

(function (window) {
  'use strict';

  function ShowEpisode(season, episode) {
    this.season = season;
    this.episode = episode;
  }

  // export to window
  window.app = window.app || {};
  window.app.ShowEpisode = ShowEpisode;
}(window));
