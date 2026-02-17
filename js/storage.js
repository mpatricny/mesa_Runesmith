/**
 * Storage - Persistence wrapper using Mesa SDK
 */
(function () {
  'use strict';

  var SAVE_KEY = 'progress';
  var LEVEL_VERSION = 3; // Bumped for 100-level campaign

  var _defaultProgress = {
    levelStars: {},
    highestUnlocked: 1,
    totalStars: 0,
    levelVersion: LEVEL_VERSION
  };

  var _progress = null;

  var Storage = {
    load: function () {
      return Mesa.data.getItem(SAVE_KEY).then(function (data) {
        if (data && data.levelVersion === LEVEL_VERSION) {
          _progress = {
            levelStars: data.levelStars || {},
            highestUnlocked: data.highestUnlocked || 1,
            totalStars: data.totalStars || 0,
            levelVersion: LEVEL_VERSION
          };
        } else {
          _progress = JSON.parse(JSON.stringify(_defaultProgress));
        }
        return _progress;
      });
    },

    save: function () {
      if (!_progress) return Promise.resolve();
      return Mesa.data.setItem(SAVE_KEY, _progress);
    },

    getProgress: function () {
      return _progress || JSON.parse(JSON.stringify(_defaultProgress));
    },

    completeLevel: function (levelId, stars) {
      if (!_progress) _progress = JSON.parse(JSON.stringify(_defaultProgress));

      var prev = _progress.levelStars[levelId] || 0;
      if (stars > prev) {
        _progress.levelStars[levelId] = stars;
      }

      var nextLevel = levelId + 1;
      if (nextLevel > _progress.highestUnlocked) {
        _progress.highestUnlocked = nextLevel;
      }

      // Recalculate total stars
      var total = 0;
      for (var k in _progress.levelStars) {
        total += _progress.levelStars[k];
      }
      _progress.totalStars = total;

      return Storage.save();
    },

    getStars: function (levelId) {
      if (!_progress) return 0;
      return _progress.levelStars[levelId] || 0;
    },

    getHighestUnlocked: function () {
      if (!_progress) return 1;
      return _progress.highestUnlocked;
    },

    getTotalStars: function () {
      if (!_progress) return 0;
      return _progress.totalStars;
    },

    getLocationStars: function (locationId) {
      if (!_progress) return 0;
      var meta = Levels.getLocationMeta(locationId);
      var total = 0;
      for (var i = meta.startLevel; i <= meta.endLevel; i++) {
        total += (_progress.levelStars[i] || 0);
      }
      return total;
    },

    isBreachLocked: function (levelId) {
      var level = Levels.getMeta(levelId);
      if (!level || !level.isBreachSeal) return false;
      var locStars = Storage.getLocationStars(level.location);
      return locStars < Levels.getBreachSealGate();
    },

    isLocationUnlocked: function (locationId) {
      if (locationId <= 1) return true;
      var prevMeta = Levels.getLocationMeta(locationId - 1);
      return Storage.getStars(prevMeta.endLevel) > 0;
    },

    isBreachSealed: function (locationId) {
      var meta = Levels.getLocationMeta(locationId);
      return Storage.getStars(meta.endLevel) > 0;
    },

    reset: function () {
      _progress = JSON.parse(JSON.stringify(_defaultProgress));
      return Storage.save();
    }
  };

  window.Storage = Storage;
})();
