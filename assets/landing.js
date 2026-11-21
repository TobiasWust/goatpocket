// Landing page helper (classic script, runs before the page renders).
//
// The app lives at app.goatpocket.com. Locally and when self-hosted it sits next to
// this page under /app/ instead. Home-screen installs made before the move still start
// at the site root; when the page runs as an installed app, go straight to the dashboard.
(function () {
  var local = !/(^|\.)goatpocket\.com$/.test(window.location.hostname);
  var appUrl = local ? 'app/' : 'https://app.goatpocket.com/';
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  // "?about" is how the app links here on purpose (Settings → About GoatPocket).
  var wantsLanding = /[?&]about\b/.test(window.location.search);
  if (standalone && !wantsLanding) {
    window.location.replace(appUrl + window.location.search);
    return;
  }

  // Returning users: label the main button accordingly.
  var connected = false;
  try {
    connected = !!window.localStorage.getItem('goatpocket.cfg');
  } catch (e) {
    /* storage unavailable */
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (local) {
      document.querySelectorAll('a[data-app]').forEach(function (a) {
        a.href = appUrl + a.getAttribute('data-app');
      });
    }
    var button = document.getElementById('open-app');
    if (connected && button) button.textContent = 'Open your dashboard';
  });
})();
