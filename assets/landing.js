// Landing page helper (classic script, runs before the page renders).
//
// Home-screen installs made before the app moved to /app/ still start at the site
// root. When the page runs as an installed app, go straight to the dashboard.
(function () {
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) {
    window.location.replace('app/' + window.location.search);
    return;
  }

  // Returning users: label the main button accordingly.
  var connected = false;
  try {
    connected = !!window.localStorage.getItem('goatpocket.cfg');
  } catch (e) {
    /* storage unavailable */
  }
  if (connected) {
    document.addEventListener('DOMContentLoaded', function () {
      var button = document.getElementById('open-app');
      if (button) button.textContent = 'Open your dashboard';
    });
  }
})();
