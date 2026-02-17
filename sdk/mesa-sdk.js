/**
 * Mesa SDK - Platform integration layer
 * Provides persistence and platform hooks via localStorage fallback
 */
(function () {
  'use strict';

  var _initialized = false;
  var _storagePrefix = 'runesmith_';

  var Mesa = {
    init: function (opts) {
      _initialized = true;
      if (opts && opts.onReady) {
        opts.onReady();
      }
      return Promise.resolve();
    },

    data: {
      setItem: function (key, value) {
        try {
          localStorage.setItem(_storagePrefix + key, JSON.stringify(value));
          return Promise.resolve();
        } catch (e) {
          console.warn('Mesa storage write failed:', e);
          return Promise.reject(e);
        }
      },

      getItem: function (key) {
        try {
          var raw = localStorage.getItem(_storagePrefix + key);
          return Promise.resolve(raw ? JSON.parse(raw) : null);
        } catch (e) {
          console.warn('Mesa storage read failed:', e);
          return Promise.resolve(null);
        }
      },

      removeItem: function (key) {
        try {
          localStorage.removeItem(_storagePrefix + key);
          return Promise.resolve();
        } catch (e) {
          return Promise.reject(e);
        }
      }
    },

    isInitialized: function () {
      return _initialized;
    }
  };

  window.Mesa = Mesa;
})();
