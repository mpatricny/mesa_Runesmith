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

    leaderboard: {
      submit: function (name, score) {
        try {
          var raw = localStorage.getItem(_storagePrefix + 'leaderboard');
          var entries = raw ? JSON.parse(raw) : [];
          var found = false;
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].name === name) {
              if (score > entries[i].score) {
                entries[i].score = score;
                entries[i].date = new Date().toISOString();
              }
              found = true;
              break;
            }
          }
          if (!found) {
            entries.push({ name: name, score: score, date: new Date().toISOString() });
          }
          localStorage.setItem(_storagePrefix + 'leaderboard', JSON.stringify(entries));
          return Promise.resolve();
        } catch (e) {
          console.warn('Mesa leaderboard submit failed:', e);
          return Promise.reject(e);
        }
      },

      fetch: function (limit) {
        try {
          var raw = localStorage.getItem(_storagePrefix + 'leaderboard');
          var entries = raw ? JSON.parse(raw) : [];
          entries.sort(function (a, b) { return b.score - a.score; });
          return Promise.resolve(entries.slice(0, limit || 20));
        } catch (e) {
          console.warn('Mesa leaderboard fetch failed:', e);
          return Promise.resolve([]);
        }
      }
    },

    isInitialized: function () {
      return _initialized;
    }
  };

  window.Mesa = Mesa;
})();
