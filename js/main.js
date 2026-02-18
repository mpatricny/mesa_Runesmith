/**
 * Main - Bootstrap, lifecycle, asset loading
 */
(function () {
  'use strict';

  function boot() {
    // Init Mesa SDK first, then other modules
    Mesa.init().then(function () {
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
