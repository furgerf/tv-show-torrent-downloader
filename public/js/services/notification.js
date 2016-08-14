
/*global app*/

(function (window) {

  function Notification() {
    const AnimationName = 'notification-animation';
    var notification = document.getElementById('notification');

    this.show = function (text) {
      // set text
      notification.innerHTML = text;
      // start animation
      notification.className += ' ' + AnimationName;
      // start delayed animation-removal
      // NOTE: the delay should match the animation duration, specified in the css
      setTimeout(function () {
        notification.className = notification.className.replace(
            new RegExp("(?:^|\\s)" + AnimationName + "(?!\\S)", "g"),
            '');
      }, 2000);
    };
  };

  // Export to window
  window.app = window.app || {};
  window.app.Notification = Notification;
}(window));

