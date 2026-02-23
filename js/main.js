/**
 * Main - Bootstrap, lifecycle, asset loading
 */
(function () {
  'use strict';

  function boot() {
    // Init Mesa SDK first, then other modules
    Mesa.init().then(function () {
      Mesa.game.loadingStart();

      // Listen for SDK errors and surface them
      Mesa.on('error', function (err) {
        Mesa.log.warn('Mesa error:', err);
        if (window.UI && UI.showToast) UI.showToast('Connection error');
      });

      I18n.init('en');
      Audio.init();

      var canvas = document.getElementById('game-canvas');
      Game.init(canvas);

      // Load assets, storage, then init UI
      return Promise.all([
        Game.loadAssets(),
        Storage.load()
      ]);
    }).then(function () {
      // Validate levels in dev
      var issues = Levels.validate();
      if (issues.length > 0) {
        console.warn('Level issues:', issues);
      }

      UI.init();
      Mesa.game.loadingEnd();

      // Show title screen
      UI.showScreen('screen-title');
    }).catch(function (err) {
      console.error('Boot failed:', err);
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
