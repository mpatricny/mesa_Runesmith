/**
 * UI - Screen management, HUD, event binding, overlays
 * World map with 5 breach locations, per-location level grid
 * Enhanced with touch controls, transitions, animations
 */
(function () {
  'use strict';

  var _currentScreen = 'screen-title';
  var _currentLevel = 1;
  var _currentLocation = 1;
  var _toastTimer = null;
  var _pendingLevel = null;

  // Tutorial popups for levels 2-4
  var TUTORIALS = {
    2: { spell: 'tether', icon: '\u2B50', name: 'Rune Tether', desc: 'Pull a distant runestone toward you along a cardinal direction.', keys: 'Press 1, then a direction' },
    3: { spell: 'ghostwalk', icon: '\uD83D\uDC7B', name: 'Ghostwalk', desc: 'Phase through an adjacent runestone to the tile behind it.', keys: 'Press 3, then a direction' },
    4: { spell: 'transpose', icon: '\u2728', name: 'Transpose', desc: 'Swap positions with an adjacent runestone.', keys: 'Press 2, then a direction' }
  };

  var _shownTutorials = {};

  // Location theme colors
  var LOCATION_COLORS = {
    1: '#c9a84c',
    2: '#8a9a8a',
    3: '#6ab4ff',
    4: '#cc6644',
    5: '#9b6dcc'
  };

  function $(id) { return document.getElementById(id); }

  function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove('active');
    }
    $(id).classList.add('active');
    _currentScreen = id;
    if (id === 'screen-map') {
      // Sync hotspot overlay after layout settles
      requestAnimationFrame(function () { syncHotspotOverlay(); });
    }
  }

  function hideOverlay(id) {
    var el = $(id);
    el.classList.remove('visible');
    el.classList.add('hidden');
  }

  function showOverlay(id) {
    var el = $(id);
    el.classList.remove('hidden');
    // Trigger transition on next frame
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('visible');
      });
    });
  }

  function starString(count, max) {
    var s = '';
    for (var i = 0; i < max; i++) {
      s += i < count ? '\u2605' : '\u2606';
    }
    return s;
  }

  function starHTML(count, max) {
    var s = '';
    for (var i = 0; i < max; i++) {
      if (i < count) {
        s += '<span class="star-on">\u2605</span>';
      } else {
        s += '<span class="star-off">\u2606</span>';
      }
    }
    return s;
  }

  // ---- World Map (Image-based) ----

  // Hotspot positions as % of the map image (x, y center points)
  // Matches realm-map.png: Tower(left), Crypts(bottom-left), Spire(top-center), Ember(bottom-right), Breach(right)
  var MAP_HOTSPOT_POSITIONS = {
    1: { x: 20, y: 35 },   // Runesmith's Tower — top-left tower
    2: { x: 22, y: 75 },   // Sunken Crypts — bottom-left green
    3: { x: 48, y: 25 },   // Frozen Spire — top-center ice
    4: { x: 62, y: 72 },   // Ember Sanctum — bottom-right fire
    5: { x: 83, y: 35 }    // Final Breach — right purple portal
  };

  // Adjust hotspot overlay to match the actual rendered image area (object-fit: contain adds letterboxing)
  function syncHotspotOverlay() {
    var img = $('map-image');
    var container = $('map-hotspots');
    if (!img || !container) return;

    var wrapW = img.parentElement.clientWidth;
    var wrapH = img.parentElement.clientHeight;
    var imgRatio = img.naturalWidth / img.naturalHeight;
    var wrapRatio = wrapW / wrapH;

    var renderedW, renderedH, offsetX, offsetY;
    if (wrapRatio > imgRatio) {
      // Letterboxed on sides
      renderedH = wrapH;
      renderedW = wrapH * imgRatio;
      offsetX = (wrapW - renderedW) / 2;
      offsetY = 0;
    } else {
      // Letterboxed on top/bottom
      renderedW = wrapW;
      renderedH = wrapW / imgRatio;
      offsetX = 0;
      offsetY = (wrapH - renderedH) / 2;
    }

    container.style.left = offsetX + 'px';
    container.style.top = offsetY + 'px';
    container.style.width = renderedW + 'px';
    container.style.height = renderedH + 'px';
  }

  function buildMap() {
    var container = $('map-hotspots');
    container.innerHTML = '';
    syncHotspotOverlay();

    for (var i = 1; i <= 5; i++) {
      var loc = Levels.getLocationMeta(i);
      var unlocked = Storage.isLocationUnlocked(i);
      var sealed = Storage.isBreachSealed(i);
      var stars = Storage.getLocationStars(i);
      var maxStars = 20 * 3;
      var color = LOCATION_COLORS[i];
      var pos = MAP_HOTSPOT_POSITIONS[i];

      var hotspot = document.createElement('div');
      hotspot.className = 'map-hotspot';
      if (!unlocked) hotspot.classList.add('locked');
      else if (sealed) hotspot.classList.add('sealed');
      else hotspot.classList.add('active');

      hotspot.style.left = pos.x + '%';
      hotspot.style.top = pos.y + '%';
      hotspot.style.transform = 'translate(-50%, -50%)';
      hotspot.style.setProperty('--loc-color', color);

      // Glowing ring
      var ring = document.createElement('div');
      ring.className = 'map-loc-ring';
      hotspot.appendChild(ring);

      // Name label
      var nameEl = document.createElement('div');
      nameEl.className = 'map-loc-name';
      nameEl.textContent = loc.name;
      hotspot.appendChild(nameEl);

      // Stars or locked text
      var starsEl = document.createElement('div');
      if (!unlocked) {
        starsEl.className = 'map-loc-subtitle';
        starsEl.textContent = '\uD83D\uDD12 Locked';
      } else {
        starsEl.className = 'map-loc-stars';
        starsEl.innerHTML = '\u2605 ' + stars + ' / ' + maxStars;
      }
      hotspot.appendChild(starsEl);

      // Badge
      var badge = document.createElement('div');
      badge.className = 'map-loc-badge';
      if (sealed) {
        badge.textContent = '\u2713 Sealed';
        badge.classList.add('badge-sealed');
      } else if (unlocked) {
        badge.textContent = 'Active';
        badge.classList.add('badge-active');
      }
      if (badge.textContent) hotspot.appendChild(badge);

      // Click handler
      if (unlocked) {
        (function (locId) {
          hotspot.addEventListener('click', function () {
            Audio.playUIClick();
            _currentLocation = locId;
            buildLevelGrid(locId);
            showScreen('screen-levels');
          });
        })(i);
      }

      container.appendChild(hotspot);
    }
  }

  // ---- Level Grid ----
  function buildLevelGrid(locationId) {
    if (!locationId) locationId = _currentLocation;
    var grid = $('levels-grid');
    grid.innerHTML = '';

    var loc = Levels.getLocationMeta(locationId);
    var levelIds = Levels.getLocationLevels(locationId);
    var highest = Storage.getHighestUnlocked();
    var locStars = Storage.getLocationStars(locationId);
    var gate = Levels.getBreachSealGate();

    $('levels-location-name').textContent = loc.name;
    $('levels-star-count').innerHTML = '\u2605 ' + locStars + ' / ' + (levelIds.length * 3);

    for (var i = 0; i < levelIds.length; i++) {
      var levelId = levelIds[i];
      var cell = document.createElement('div');
      cell.className = 'level-cell';
      var stars = Storage.getStars(levelId);
      var meta = Levels.getMeta(levelId);
      var isBreachSeal = meta && meta.isBreachSeal;
      var breachLocked = Storage.isBreachLocked(levelId);

      if (isBreachSeal) {
        cell.classList.add('breach-seal');
      }

      if (levelId > highest || breachLocked) {
        cell.classList.add('locked');
        var lockInfo = '';
        if (isBreachSeal && breachLocked) {
          lockInfo = '<span class="level-lock-info">' + gate + '\u2605</span>';
        } else {
          lockInfo = '<span class="level-stars">\uD83D\uDD12</span>';
        }
        cell.innerHTML = '<span class="level-num">' + levelId + '</span>' + lockInfo;
      } else {
        if (stars > 0) cell.classList.add('completed');
        cell.innerHTML = '<span class="level-num">' + levelId + '</span>' +
          '<span class="level-stars">' + starString(stars, 3) + '</span>';
        cell.dataset.level = levelId;
        cell.addEventListener('click', onLevelCellClick);
      }
      grid.appendChild(cell);
    }
  }

  function onLevelCellClick(e) {
    var cell = e.currentTarget;
    var id = parseInt(cell.dataset.level);
    if (id) {
      Audio.playUIClick();
      startLevel(id);
    }
  }

  // ---- Start Level ----
  function startLevel(id) {
    if (!Storage.getPlayerName()) {
      _pendingLevel = id;
      $('input-player-name').value = '';
      showOverlay('overlay-name');
      return;
    }

    _currentLevel = id;
    _currentLocation = Levels.getLocation(id);
    var success = Game.startLevel(id);
    if (!success) return;

    showScreen('screen-game');
    Game.resizeCanvas();
    updateHUD();
    updateSpellButtons();

    if (TUTORIALS[id] && !_shownTutorials[id]) {
      _shownTutorials[id] = true;
      showTutorial(TUTORIALS[id]);
    }

    Audio.playLevelStart();
  }

  // ---- HUD Updates ----
  function updateHUD() {
    var state = Game.getState();
    var level = Game.getLevel();
    if (!state || !level) return;

    $('hud-level-name').textContent = 'Level ' + level.id + ': ' + level.name;
    $('hud-moves').textContent = state.moves;

    $('charges-tether').textContent = '(' + state.charges.tether + ')';
    $('charges-transpose').textContent = '(' + state.charges.transpose + ')';
    $('charges-ghostwalk').textContent = '(' + state.charges.ghostwalk + ')';
  }

  function updateSpellButtons() {
    var state = Game.getState();
    var level = Game.getLevel();
    if (!state || !level) return;

    var active = Game.getActiveSpell();

    ['tether', 'transpose', 'ghostwalk'].forEach(function (name) {
      var btn = $('spell-' + name);
      btn.classList.remove('active', 'disabled');

      if (state.charges[name] <= 0) {
        btn.classList.add('disabled');
      }

      if (active === name) {
        btn.classList.add('active');
      }
    });
  }

  // ---- Victory ----
  function showVictory(levelId, stars, state) {
    $('victory-stars').innerHTML = starHTML(stars, 3);

    var spellMsg = '';
    if (state.spellsUsed === 0) {
      spellMsg = 'No spells used \u2014 Perfect!';
    } else {
      spellMsg = 'Spells used: ' + state.spellsUsed;
    }

    var stats = '<strong>Moves:</strong> ' + state.moves + '<br>' +
      '<strong>' + spellMsg + '</strong>';
    $('victory-stats').innerHTML = stats;

    var nextBtn = $('btn-victory-next');
    var loc = Levels.getLocationMeta(_currentLocation);
    if (levelId >= Levels.getCount()) {
      nextBtn.textContent = 'Finish';
    } else if (levelId >= loc.endLevel) {
      nextBtn.textContent = 'Back to Map';
    } else {
      nextBtn.textContent = I18n.t('next');
    }

    Storage.completeLevel(levelId, stars);

    setTimeout(function () {
      showOverlay('overlay-victory');
    }, 600);
  }

  // ---- Tutorial Overlay ----
  function showTutorial(info) {
    $('tutorial-icon').textContent = info.icon;
    $('tutorial-icon').className = 'tutorial-icon ' + info.spell;
    $('tutorial-name').textContent = info.name;
    $('tutorial-desc').textContent = info.desc;
    $('tutorial-keys').textContent = info.keys;
    showOverlay('overlay-tutorial');
  }

  // ---- Toast ----
  function showToast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('visible');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      el.classList.remove('visible');
    }, 1800);
  }

  // ---- Leaderboard ----
  function showLeaderboard() {
    Mesa.leaderboard.getTop({ key: 'default', limit: 20 }).then(function (res) {
      var entries = res.entries || [];
      var tbody = $('lb-body');
      tbody.innerHTML = '';
      var playerName = Storage.getPlayerName();

      if (entries.length === 0) {
        var row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="color:var(--parchment-dim);font-style:italic">No entries yet</td>';
        tbody.appendChild(row);
      } else {
        for (var i = 0; i < entries.length; i++) {
          var row = document.createElement('tr');
          if (entries[i].playerName === playerName || entries[i].isCurrentUser) {
            row.className = 'lb-self';
          }
          row.innerHTML = '<td>' + entries[i].rank + '</td>' +
            '<td>' + entries[i].playerName + '</td>' +
            '<td>' + entries[i].displayValue + '</td>';
          tbody.appendChild(row);
        }
      }
      showOverlay('overlay-leaderboard');
    });
  }

  // ---- Event Binding ----
  function bindEvents() {
    // Title screen
    $('btn-play').addEventListener('click', function () {
      Audio.playUIClick();
      var highest = Storage.getHighestUnlocked();
      startLevel(Math.min(highest, Levels.getCount()));
    });

    $('btn-world-map').addEventListener('click', function () {
      Audio.playUIClick();
      buildMap();
      showScreen('screen-map');
    });

    $('btn-leaderboard').addEventListener('click', function () {
      Audio.playUIClick();
      showLeaderboard();
    });

    // World map
    $('btn-map-back').addEventListener('click', function () {
      Audio.playUIClick();
      showScreen('screen-title');
      updateTitleStars();
    });

    // Level select
    $('btn-levels-back').addEventListener('click', function () {
      Audio.playUIClick();
      buildMap();
      showScreen('screen-map');
    });

    $('btn-levels-map').addEventListener('click', function () {
      Audio.playUIClick();
      buildMap();
      showScreen('screen-map');
    });

    // Game controls
    $('btn-undo').addEventListener('click', function () {
      Audio.playUIClick();
      Game.undo();
    });

    $('btn-restart').addEventListener('click', function () {
      Audio.playUIClick();
      Game.restart();
    });

    $('btn-menu').addEventListener('click', function () {
      Audio.playUIClick();
      Game.stopRenderLoop();
      buildMap();
      showScreen('screen-map');
    });

    // Spell buttons
    ['tether', 'transpose', 'ghostwalk'].forEach(function (name) {
      $('spell-' + name).addEventListener('click', function () {
        Audio.playUIClick();
        Game.toggleSpell(name);
        updateSpellButtons();
      });
    });

    // D-pad buttons
    var dpadBtns = document.querySelectorAll('.dpad-btn[data-dir]');
    for (var i = 0; i < dpadBtns.length; i++) {
      dpadBtns[i].addEventListener('click', function (e) {
        e.preventDefault();
        var dir = this.getAttribute('data-dir');
        if (dir) {
          Game.handleDpadInput(dir);
        }
      });
      // Prevent long-press context menu on mobile
      dpadBtns[i].addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });
    }

    // Victory overlay
    $('btn-victory-restart').addEventListener('click', function () {
      Audio.playUIClick();
      hideOverlay('overlay-victory');
      Game.restart();
      updateHUD();
      updateSpellButtons();
    });

    $('btn-victory-next').addEventListener('click', function () {
      Audio.playUIClick();
      hideOverlay('overlay-victory');

      var loc = Levels.getLocationMeta(_currentLocation);

      if (_currentLevel >= Levels.getCount()) {
        showCampaignComplete();
      } else if (_currentLevel >= loc.endLevel) {
        buildMap();
        showScreen('screen-map');
      } else {
        var nextId = _currentLevel + 1;
        if (Storage.isBreachLocked(nextId)) {
          buildLevelGrid(_currentLocation);
          showScreen('screen-levels');
        } else {
          startLevel(nextId);
        }
      }
    });

    // Spell unlock overlay
    $('btn-spell-ok').addEventListener('click', function () {
      Audio.playUIClick();
      hideOverlay('overlay-spell');
    });

    // Tutorial overlay
    $('btn-tutorial-ok').addEventListener('click', function () {
      Audio.playUIClick();
      hideOverlay('overlay-tutorial');
    });

    // Campaign complete
    $('btn-campaign-levels').addEventListener('click', function () {
      Audio.playUIClick();
      hideOverlay('overlay-campaign');
      buildMap();
      showScreen('screen-map');
    });

    $('btn-campaign-menu').addEventListener('click', function () {
      Audio.playUIClick();
      hideOverlay('overlay-campaign');
      showScreen('screen-title');
      updateTitleStars();
    });

    // Name prompt
    $('btn-name-ok').addEventListener('click', function () {
      Audio.playUIClick();
      var name = $('input-player-name').value.trim();
      if (!name) return;
      Storage.setPlayerName(name);
      hideOverlay('overlay-name');
      if (_pendingLevel) {
        var lvl = _pendingLevel;
        _pendingLevel = null;
        startLevel(lvl);
      }
    });

    $('input-player-name').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        $('btn-name-ok').click();
      }
    });

    // Leaderboard
    $('btn-lb-close').addEventListener('click', function () {
      Audio.playUIClick();
      hideOverlay('overlay-leaderboard');
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (_currentScreen === 'screen-game') {
        if (e.key === 'Escape') {
          Game.stopRenderLoop();
          buildMap();
          showScreen('screen-map');
          return;
        }
        Game.handleKeyDown(e);
      }
    });

    // Window resize
    window.addEventListener('resize', function () {
      if (_currentScreen === 'screen-game') {
        Game.resizeCanvas();
      }
      if (_currentScreen === 'screen-map') {
        syncHotspotOverlay();
      }
    });

    // Game callbacks
    Game.onWin(function (levelId, stars, state) {
      showVictory(levelId, stars, state);
    });

    Game.onStateChange(function () {
      updateHUD();
      updateSpellButtons();
    });
  }

  function showCampaignComplete() {
    var total = Storage.getTotalStars();
    var max = Levels.getCount() * 3;
    $('campaign-stats').innerHTML =
      '<strong>' + I18n.t('totalStars') + ':</strong> ' + total + ' / ' + max + '<br>' +
      I18n.t('campaignCompleteMsg');
    showOverlay('overlay-campaign');
  }

  function updateTitleStars() {
    var total = Storage.getTotalStars();
    var max = Levels.getCount() * 3;
    var el = $('title-total-stars');
    if (total > 0) {
      el.textContent = '\u2605 ' + total + '/' + max;
    } else {
      el.textContent = '';
    }
  }

  // ---- Public API ----
  var UI = {
    init: function () {
      bindEvents();
      updateTitleStars();
    },

    showScreen: showScreen,
    showToast: showToast,
    updateHUD: updateHUD,
    startLevel: startLevel,
    buildLevelGrid: buildLevelGrid
  };

  window.UI = UI;
})();
