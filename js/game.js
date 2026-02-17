/**
 * Game - Core engine: state, canvas rendering, input, spells, undo
 * Enhanced with touch input, smooth animation, procedural art, particles
 */
(function () {
  'use strict';

  // ---- Constants ----
  var TILE = 48;
  var ANIM_DURATION = 120; // ms for movement tween
  var SIGIL_PULSE_SPEED = 0.003;

  // Per-location environment themes
  var THEMES = {
    // 1: Runesmith's Tower — warm sandstone & gold
    1: {
      floor: '#2a2218', floorAlt: '#252015',
      wall: '#5a4a30', wallTop: '#6a5a3a', wallDark: '#4a3a22',
      stone: '#8a7a60', stoneTop: '#9a8a70', stoneDark: '#6a5a44',
      void: '#080705', dust: '#c9a84c',
      mortarAlpha: 0.2
    },
    // 2: Sunken Crypts — cool grey-green, mossy stone
    2: {
      floor: '#1e2420', floorAlt: '#1a211c',
      wall: '#3e4e42', wallTop: '#506050', wallDark: '#2c3830',
      stone: '#607060', stoneTop: '#708070', stoneDark: '#4a5a4e',
      void: '#060807', dust: '#7aaa8a',
      mortarAlpha: 0.25
    },
    // 3: Frozen Spire — icy blue-white, crystalline
    3: {
      floor: '#1c2230', floorAlt: '#181e2a',
      wall: '#4a5a70', wallTop: '#607088', wallDark: '#364060',
      stone: '#607888', stoneTop: '#708898', stoneDark: '#4a6070',
      void: '#050810', dust: '#8ac0e8',
      mortarAlpha: 0.18
    },
    // 4: Ember Sanctum — dark volcanic, red-orange lava tints
    4: {
      floor: '#281810', floorAlt: '#22140e',
      wall: '#5a3020', wallTop: '#704028', wallDark: '#3a1c12',
      stone: '#886048', stoneTop: '#987058', stoneDark: '#6a4430',
      void: '#0a0504', dust: '#e88844',
      mortarAlpha: 0.22
    },
    // 5: Final Breach — dark arcane purple, void-touched
    5: {
      floor: '#1e1628', floorAlt: '#1a1222',
      wall: '#4a3660', wallTop: '#5c4678', wallDark: '#30204a',
      stone: '#685878', stoneTop: '#786888', stoneDark: '#504060',
      void: '#060410', dust: '#b08ae8',
      mortarAlpha: 0.2
    }
  };

  // Active theme (set per level)
  var T = THEMES[1];

  // Shared colors (not themed)
  var C = {
    sigil:    '#4a8fcc',
    sigilGlow:'#6ab4ff',
    player:   '#c9a84c',
    playerCloak: '#8a6a2c',
    playerCloakDark: '#6a4e1c',
    playerFace: '#d4b896',
    playerEye:'#1a1410',
    shadow:   'rgba(0,0,0,0.3)',
    sealed:   '#44cc66',
    gold:     '#c9a84c',
    goldDim:  'rgba(201,168,76,0.15)'
  };

  // Direction vectors
  var DIR = {
    up:    { dx:  0, dy: -1 },
    down:  { dx:  0, dy:  1 },
    left:  { dx: -1, dy:  0 },
    right: { dx:  1, dy:  0 }
  };

  // ---- State ----
  var _canvas, _ctx;
  var _state = null;
  var _level = null;
  var _undoStack = [];
  var _activeSpell = null;
  var _animating = false;
  var _anims = [];
  var _rafId = null;
  var _time = 0;
  var _onWin = null;
  var _onStateChange = null;

  // Assets
  var _images = {};
  var _assetsLoaded = false;

  // Player sprite info
  var _playerFrames = 1;
  var _playerFrameW = 0;
  var _playerFrameH = 0;

  // Touch input
  var _touchStartX = 0;
  var _touchStartY = 0;
  var _touchStartTime = 0;

  // Offscreen caches
  var _floorCache = null;
  var _wallCache = null;

  // Particles
  var _particles = [];
  var _dustParticles = [];

  // Spell flash
  var _spellFlash = null; // { color, alpha, startTime }

  // Seeded RNG for consistent procedural textures
  function seededRand(x, y, seed) {
    var n = Math.sin(x * 127.1 + y * 311.7 + (seed || 0) * 43758.5453) * 43758.5453;
    return n - Math.floor(n);
  }

  // ---- Helpers ----
  function key(x, y) { return x + ',' + y; }

  function copyStones(stones) {
    var c = {};
    for (var k in stones) c[k] = true;
    return c;
  }

  function copyCharges(ch) {
    return { tether: ch.tether, transpose: ch.transpose, ghostwalk: ch.ghostwalk };
  }

  function snapshot() {
    return {
      player: { x: _state.player.x, y: _state.player.y },
      stones: copyStones(_state.stones),
      charges: copyCharges(_state.charges),
      moves: _state.moves,
      spellsUsed: _state.spellsUsed,
      facing: { dx: _state.facing.dx, dy: _state.facing.dy }
    };
  }

  function isWall(x, y) {
    return !!_level.walls[key(x, y)];
  }

  function isStone(x, y) {
    return !!_state.stones[key(x, y)];
  }

  function isEmpty(x, y) {
    return !isWall(x, y) && !isStone(x, y);
  }

  function isInBounds(x, y) {
    return x >= 0 && y >= 0 && x < _level.width && y < _level.height;
  }

  function checkWin() {
    for (var k in _level.targets) {
      if (!_state.stones[k]) return false;
    }
    return true;
  }

  function calcStars(spellsUsed) {
    if (spellsUsed === 0) return 3;
    if (spellsUsed <= 1) return 2;
    return 1;
  }

  function easeOutQuad(t) {
    return t * (2 - t);
  }

  // Lerp color helper for slight variations
  function shadeColor(hex, amt) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ---- Asset Loading ----
  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  // ---- Offscreen Canvas Caching ----
  function buildFloorCache() {
    var w = _level.width;
    var h = _level.height;
    var c = document.createElement('canvas');
    c.width = w * TILE;
    c.height = h * TILE;
    var ctx = c.getContext('2d');

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var k = key(x, y);
        var tx = x * TILE;
        var ty = y * TILE;

        if (!_level.inside || !_level.inside[k]) {
          // Void tile
          drawVoidTile(ctx, tx, ty, x, y);
        } else if (_level.walls[k]) {
          drawWallTile(ctx, tx, ty, x, y);
        } else {
          drawFloorTile(ctx, tx, ty, x, y);
        }
      }
    }
    _floorCache = c;
  }

  // ---- Void Tile ----
  function drawVoidTile(ctx, x, y, gx, gy) {
    ctx.fillStyle = T.void;
    ctx.fillRect(x, y, TILE, TILE);
    // Faint noise pattern tinted by theme dust color
    var r = seededRand(gx, gy, 99);
    if (r > 0.6) {
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.fillStyle = T.dust;
      ctx.fillRect(x + r * 20, y + r * 16, TILE * 0.4, TILE * 0.3);
      ctx.restore();
    }
  }

  // ---- Enhanced Floor Tile ----
  function drawFloorTile(ctx, x, y, gx, gy) {
    if (_images.floor) {
      ctx.drawImage(_images.floor, x, y, TILE, TILE);
      return;
    }

    // Stone slab base — themed
    var baseR = seededRand(gx, gy, 0);
    var shade = Math.floor(baseR * 12) - 6;
    ctx.fillStyle = shadeColor((gx + gy) % 2 === 0 ? T.floor : T.floorAlt, shade);
    ctx.fillRect(x, y, TILE, TILE);

    // Subtle texture variations
    var r1 = seededRand(gx, gy, 1);
    var r2 = seededRand(gx, gy, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(x + r1 * 20, y + r2 * 15, TILE * 0.35, TILE * 0.25);

    var r3 = seededRand(gx, gy, 3);
    if (r3 > 0.5) {
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      ctx.fillRect(x + r3 * 15, y + r1 * 20, TILE * 0.3, TILE * 0.2);
    }

    // Mortar lines — themed alpha
    ctx.fillStyle = 'rgba(0,0,0,' + T.mortarAlpha + ')';
    ctx.fillRect(x, y, TILE, 1);
    ctx.fillRect(x, y, 1, TILE);
    ctx.fillStyle = 'rgba(0,0,0,' + (T.mortarAlpha * 0.5) + ')';
    ctx.fillRect(x + TILE - 1, y, 1, TILE);
    ctx.fillRect(x, y + TILE - 1, TILE, 1);
  }

  // ---- Enhanced Wall Tile ----
  function drawWallTile(ctx, x, y, gx, gy) {
    if (_images.wall) {
      ctx.drawImage(_images.wall, x, y, TILE, TILE);
      return;
    }

    // Dark base — themed
    ctx.fillStyle = T.wallDark;
    ctx.fillRect(x, y, TILE, TILE);

    // Two rows of bricks
    var brickH = Math.floor(TILE / 2);
    for (var row = 0; row < 2; row++) {
      var by = y + row * brickH;
      var offset = row === 1 ? Math.floor(TILE / 3) : 0;
      var brickW = Math.floor(TILE / 2);

      for (var col = -1; col < 3; col++) {
        var bx = x + col * brickW + offset;
        var drawX = Math.max(bx + 1, x);
        var drawY = by + 1;
        var drawW = Math.min(bx + brickW - 1, x + TILE) - drawX;
        var drawH = brickH - 2;
        if (drawW <= 0) continue;

        // Per-brick color variation — themed
        var brickR = seededRand(gx * 3 + col, gy * 2 + row, 7);
        var brickShade = Math.floor(brickR * 16) - 8;
        ctx.fillStyle = shadeColor(T.wall, brickShade);
        ctx.fillRect(drawX, drawY, drawW, drawH);

        // Top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(drawX, drawY, drawW, 2);

        // Bottom shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(drawX, drawY + drawH - 2, drawW, 2);
      }
    }

    // Overall top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, TILE, 3);

    // Bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, y + TILE - 4, TILE, 4);
  }

  // ---- Particles ----
  function initDustParticles() {
    _dustParticles = [];
    if (!_level) return;
    var count = Math.min(20, Math.floor(_level.width * _level.height * 0.3));
    for (var i = 0; i < count; i++) {
      _dustParticles.push({
        x: Math.random() * _level.width * TILE,
        y: Math.random() * _level.height * TILE,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -Math.random() * 0.3 - 0.1,
        size: 1 + Math.random() * 2,
        alpha: Math.random() * 0.3,
        alphaDir: (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.003),
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function updateDustParticles(t) {
    var maxX = _level.width * TILE;
    var maxY = _level.height * TILE;
    for (var i = 0; i < _dustParticles.length; i++) {
      var p = _dustParticles[i];
      p.x += p.vx + Math.sin(t * 0.0005 + p.phase) * 0.1;
      p.y += p.vy;
      p.alpha += p.alphaDir;
      if (p.alpha > 0.35) { p.alpha = 0.35; p.alphaDir = -Math.abs(p.alphaDir); }
      if (p.alpha < 0) { p.alpha = 0; p.alphaDir = Math.abs(p.alphaDir); }
      // Wrap
      if (p.y < -5) { p.y = maxY + 5; p.x = Math.random() * maxX; }
      if (p.x < -5) p.x = maxX + 5;
      if (p.x > maxX + 5) p.x = -5;
    }
  }

  function drawDustParticles(ctx) {
    for (var i = 0; i < _dustParticles.length; i++) {
      var p = _dustParticles[i];
      if (p.alpha <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = T.dust;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Dynamic particles (spell cast, stone dust, victory)
  function spawnParticles(x, y, count, color, opts) {
    opts = opts || {};
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (opts.speed || 1.5) * (0.5 + Math.random());
      _particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed + (opts.vxBias || 0),
        vy: Math.sin(angle) * speed + (opts.vyBias || 0),
        size: (opts.size || 2) + Math.random() * (opts.sizeVar || 1),
        alpha: opts.alpha || 0.8,
        decay: (opts.decay || 0.015) + Math.random() * 0.005,
        color: color,
        gravity: opts.gravity || 0
      });
    }
  }

  function updateParticles() {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
      if (p.alpha <= 0) _particles.splice(i, 1);
    }
  }

  function drawParticles(ctx) {
    for (var i = 0; i < _particles.length; i++) {
      var p = _particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnSpellFlash(spellName) {
    var colors = {
      tether: 'rgba(155,109,204,',
      transpose: 'rgba(76,201,168,',
      ghostwalk: 'rgba(204,136,68,'
    };
    _spellFlash = {
      color: colors[spellName] || 'rgba(255,255,255,',
      startTime: _time,
      duration: 100
    };
  }

  function spawnSpellParticles(x, y, spellName) {
    var colors = {
      tether: '#9b6dcc',
      transpose: '#4cc9a8',
      ghostwalk: '#cc8844'
    };
    var color = colors[spellName] || '#ffffff';
    spawnParticles(
      x * TILE + TILE / 2, y * TILE + TILE / 2,
      10, color,
      { speed: 2.5, decay: 0.025, size: 2, sizeVar: 2 }
    );
    spawnSpellFlash(spellName);
  }

  function spawnStoneDust(x, y) {
    spawnParticles(
      x * TILE + TILE / 2, y * TILE + TILE * 0.8,
      5, 'rgba(168,152,120,0.7)',
      { speed: 0.8, decay: 0.04, size: 1.5, sizeVar: 1, vyBias: -0.5 }
    );
  }

  function spawnVictoryBurst() {
    if (!_level) return;
    var cx = _level.width * TILE / 2;
    var cy = _level.height * TILE / 2;
    spawnParticles(cx, cy, 40, C.gold, {
      speed: 4, decay: 0.008, size: 3, sizeVar: 2, gravity: 0.06
    });
    // Extra sparkles
    spawnParticles(cx, cy, 15, '#ffffff', {
      speed: 3, decay: 0.012, size: 1.5, sizeVar: 1, gravity: 0.03
    });
  }

  // ---- Public API ----
  var Game = {
    init: function (canvas) {
      _canvas = canvas;
      _ctx = canvas.getContext('2d');

      // Touch events on canvas
      canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        var touch = e.touches[0];
        _touchStartX = touch.clientX;
        _touchStartY = touch.clientY;
        _touchStartTime = Date.now();
      }, { passive: false });

      canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
      }, { passive: false });

      canvas.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (!_state || _state.won || _animating) return;
        if (!e.changedTouches.length) return;

        var touch = e.changedTouches[0];
        var dx = touch.clientX - _touchStartX;
        var dy = touch.clientY - _touchStartY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) return; // too short

        var dir;
        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx > 0 ? DIR.right : DIR.left;
        } else {
          dir = dy > 0 ? DIR.down : DIR.up;
        }

        if (_activeSpell) {
          Game.castSpell(_activeSpell, dir);
          _activeSpell = null;
          if (_onStateChange) _onStateChange();
        } else {
          Game.move(dir);
        }
      }, { passive: false });
    },

    loadAssets: function () {
      var names = ['floor', 'wall', 'sigil', 'runestone', 'player', 'frame'];
      var promises = names.map(function (n) {
        return loadImage('assets/img/' + n + '.png').then(function (img) {
          if (img) _images[n] = img;
        });
      });
      return Promise.all(promises).then(function () {
        _assetsLoaded = true;
        if (_images.player) {
          var img = _images.player;
          _playerFrameH = Math.floor(img.height / 4);
          _playerFrames = Math.max(1, Math.round(img.width / _playerFrameH));
          _playerFrameW = Math.floor(img.width / _playerFrames);
        }
      });
    },

    startLevel: function (levelId) {
      _level = Levels.parse(levelId);
      if (!_level) return false;

      // Set environment theme based on location
      T = THEMES[_level.location] || THEMES[1];

      _state = {
        player: { x: _level.player.x, y: _level.player.y },
        stones: copyStones(_level.stones),
        charges: copyCharges(_level.charges),
        moves: 0,
        spellsUsed: 0,
        facing: { dx: 0, dy: 1 },
        won: false
      };

      _undoStack = [];
      _activeSpell = null;
      _animating = false;
      _anims = [];
      _particles = [];
      _spellFlash = null;

      // Build offscreen caches
      buildFloorCache();

      // Init ambient particles
      initDustParticles();

      Game.resizeCanvas();
      Game.startRenderLoop();
      return true;
    },

    resizeCanvas: function () {
      if (!_level) return;
      var container = _canvas.parentElement;
      var maxW = container.clientWidth - 16;
      var maxH = container.clientHeight - 16;

      var levelW = _level.width * TILE;
      var levelH = _level.height * TILE;

      var scale = Math.min(maxW / levelW, maxH / levelH, 1.5);
      // Ensure minimum tile size of 28px on mobile
      var minTile = ('ontouchstart' in window) ? 28 : 32;
      if (TILE * scale < minTile) scale = minTile / TILE;

      var w = Math.floor(levelW * scale);
      var h = Math.floor(levelH * scale);

      _canvas.width = levelW;
      _canvas.height = levelH;
      _canvas.style.width = w + 'px';
      _canvas.style.height = h + 'px';
      _ctx.imageSmoothingEnabled = false;
    },

    startRenderLoop: function () {
      if (_rafId) cancelAnimationFrame(_rafId);
      function loop(t) {
        _time = t;
        Game.processAnimQueue(t);
        updateParticles();
        updateDustParticles(t);
        Game.render(t);
        _rafId = requestAnimationFrame(loop);
      }
      _rafId = requestAnimationFrame(loop);
    },

    stopRenderLoop: function () {
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
    },

    // ---- Input ----
    handleKeyDown: function (e) {
      if (!_state || _state.won || _animating) return;

      var k = e.key.toLowerCase();

      if (k === 'z') {
        e.preventDefault();
        Game.undo();
        return;
      }

      if (k === 'r') {
        e.preventDefault();
        Game.restart();
        return;
      }

      if (k === '1') { Game.toggleSpell('tether'); return; }
      if (k === '2') { Game.toggleSpell('transpose'); return; }
      if (k === '3') { Game.toggleSpell('ghostwalk'); return; }

      var dir = null;
      if (k === 'arrowup' || k === 'w') dir = DIR.up;
      else if (k === 'arrowdown' || k === 's') dir = DIR.down;
      else if (k === 'arrowleft' || k === 'a') dir = DIR.left;
      else if (k === 'arrowright' || k === 'd') dir = DIR.right;

      if (!dir) return;
      e.preventDefault();

      if (_activeSpell) {
        Game.castSpell(_activeSpell, dir);
        _activeSpell = null;
        if (_onStateChange) _onStateChange();
      } else {
        Game.move(dir);
      }
    },

    // D-pad input (called from UI)
    handleDpadInput: function (dirName) {
      if (!_state || _state.won || _animating) return;
      var dir = DIR[dirName];
      if (!dir) return;

      if (_activeSpell) {
        Game.castSpell(_activeSpell, dir);
        _activeSpell = null;
        if (_onStateChange) _onStateChange();
      } else {
        Game.move(dir);
      }
    },

    // ---- Movement ----
    move: function (dir) {
      var oldPx = _state.player.x;
      var oldPy = _state.player.y;
      var px = oldPx + dir.dx;
      var py = oldPy + dir.dy;

      _state.facing = { dx: dir.dx, dy: dir.dy };

      if (isWall(px, py)) {
        Audio.playError();
        return false;
      }

      if (isStone(px, py)) {
        var bx = px + dir.dx;
        var by = py + dir.dy;
        if (!isInBounds(bx, by) || isWall(bx, by) || isStone(bx, by)) {
          Audio.playError();
          return false;
        }

        _undoStack.push(snapshot());
        delete _state.stones[key(px, py)];
        _state.stones[key(bx, by)] = true;
        _state.player.x = px;
        _state.player.y = py;
        _state.moves++;
        Audio.playPush();

        // Animate player and stone
        _anims.push({ type: 'player', fromX: oldPx, fromY: oldPy, toX: px, toY: py, startTime: _time, duration: ANIM_DURATION });
        _anims.push({ type: 'stone', key: key(bx, by), fromX: px, fromY: py, toX: bx, toY: by, startTime: _time, duration: ANIM_DURATION });
        _animating = true;

        // Stone dust at landing
        spawnStoneDust(bx, by);

        Game.checkVictory();
        if (_onStateChange) _onStateChange();
        return true;
      }

      if (!isInBounds(px, py)) return false;

      _undoStack.push(snapshot());
      _state.player.x = px;
      _state.player.y = py;
      _state.moves++;
      Audio.playStep();

      // Animate player
      _anims.push({ type: 'player', fromX: oldPx, fromY: oldPy, toX: px, toY: py, startTime: _time, duration: ANIM_DURATION });
      _animating = true;

      if (_onStateChange) _onStateChange();
      return true;
    },

    // ---- Spells ----
    toggleSpell: function (name) {
      if (_state.charges[name] <= 0) {
        Audio.playError();
        if (window.UI) UI.showToast(I18n.t('noCharges'));
        return;
      }

      if (_activeSpell === name) {
        _activeSpell = null;
      } else {
        _activeSpell = name;
      }
      if (_onStateChange) _onStateChange();
    },

    castSpell: function (spellName, dir) {
      var success = false;
      switch (spellName) {
        case 'tether':
          success = Game.castTether(dir);
          break;
        case 'transpose':
          success = Game.castTranspose(dir);
          break;
        case 'ghostwalk':
          success = Game.castGhostwalk(dir);
          break;
      }
      if (!success) {
        Audio.playError();
        if (window.UI) UI.showToast(I18n.t('spellBlocked'));
      }
      return success;
    },

    castTether: function (dir) {
      if (_state.charges.tether <= 0) return false;

      var px = _state.player.x;
      var py = _state.player.y;

      var fx = px + dir.dx;
      var fy = py + dir.dy;
      if (!isInBounds(fx, fy) || isWall(fx, fy) || isStone(fx, fy)) return false;

      var cx = fx + dir.dx;
      var cy = fy + dir.dy;
      while (isInBounds(cx, cy) && !isWall(cx, cy)) {
        if (isStone(cx, cy)) {
          _undoStack.push(snapshot());
          _state.facing = { dx: dir.dx, dy: dir.dy };
          var newX = cx - dir.dx;
          var newY = cy - dir.dy;
          delete _state.stones[key(cx, cy)];
          _state.stones[key(newX, newY)] = true;
          _state.charges.tether--;
          _state.spellsUsed++;
          _state.moves++;
          Audio.playSpellCast('tether');

          // Animate stone pull
          _anims.push({ type: 'stone', key: key(newX, newY), fromX: cx, fromY: cy, toX: newX, toY: newY, startTime: _time, duration: ANIM_DURATION });
          _animating = true;

          spawnSpellParticles(px, py, 'tether');
          spawnStoneDust(newX, newY);

          Game.checkVictory();
          if (_onStateChange) _onStateChange();
          return true;
        }
        cx += dir.dx;
        cy += dir.dy;
      }
      return false;
    },

    castTranspose: function (dir) {
      if (_state.charges.transpose <= 0) return false;

      var px = _state.player.x;
      var py = _state.player.y;
      var sx = px + dir.dx;
      var sy = py + dir.dy;

      if (!isStone(sx, sy)) return false;

      _undoStack.push(snapshot());
      _state.facing = { dx: dir.dx, dy: dir.dy };

      delete _state.stones[key(sx, sy)];
      _state.stones[key(px, py)] = true;
      _state.player.x = sx;
      _state.player.y = sy;

      _state.charges.transpose--;
      _state.spellsUsed++;
      _state.moves++;
      Audio.playSpellCast('transpose');

      // Animate swap
      _anims.push({ type: 'player', fromX: px, fromY: py, toX: sx, toY: sy, startTime: _time, duration: ANIM_DURATION });
      _anims.push({ type: 'stone', key: key(px, py), fromX: sx, fromY: sy, toX: px, toY: py, startTime: _time, duration: ANIM_DURATION });
      _animating = true;

      spawnSpellParticles(px, py, 'transpose');

      Game.checkVictory();
      if (_onStateChange) _onStateChange();
      return true;
    },

    castGhostwalk: function (dir) {
      if (_state.charges.ghostwalk <= 0) return false;

      var px = _state.player.x;
      var py = _state.player.y;
      var sx = px + dir.dx;
      var sy = py + dir.dy;

      if (!isStone(sx, sy)) return false;

      var bx = sx + dir.dx;
      var by = sy + dir.dy;
      if (!isInBounds(bx, by) || isWall(bx, by) || isStone(bx, by)) return false;

      _undoStack.push(snapshot());
      _state.facing = { dx: dir.dx, dy: dir.dy };

      _state.player.x = bx;
      _state.player.y = by;

      _state.charges.ghostwalk--;
      _state.spellsUsed++;
      _state.moves++;
      Audio.playSpellCast('ghostwalk');

      // Animate player phasing through
      _anims.push({ type: 'player', fromX: px, fromY: py, toX: bx, toY: by, startTime: _time, duration: ANIM_DURATION * 1.2 });
      _animating = true;

      spawnSpellParticles(px, py, 'ghostwalk');

      Game.checkVictory();
      if (_onStateChange) _onStateChange();
      return true;
    },

    // ---- Undo / Restart ----
    undo: function () {
      if (_undoStack.length === 0) return;
      var snap = _undoStack.pop();
      _state.player = snap.player;
      _state.stones = snap.stones;
      _state.charges = snap.charges;
      _state.moves = snap.moves;
      _state.spellsUsed = snap.spellsUsed;
      _state.facing = snap.facing;
      _activeSpell = null;
      _anims = [];
      _animating = false;
      Audio.playUndo();
      if (_onStateChange) _onStateChange();
    },

    restart: function () {
      if (!_level) return;
      Game.startLevel(_level.id);
      Audio.playLevelStart();
      if (_onStateChange) _onStateChange();
    },

    // ---- Win Detection ----
    checkVictory: function () {
      if (checkWin()) {
        _state.won = true;
        _activeSpell = null;
        var stars = calcStars(_state.spellsUsed);
        Audio.playSealComplete();
        spawnVictoryBurst();
        if (_onWin) _onWin(_level.id, stars, _state);
      }
    },

    // ---- Animation Queue ----
    processAnimQueue: function (t) {
      if (!_anims.length) {
        _animating = false;
        return;
      }
      _animating = true;

      for (var i = _anims.length - 1; i >= 0; i--) {
        var a = _anims[i];
        var elapsed = t - a.startTime;
        a.progress = Math.min(elapsed / a.duration, 1);
        a.progress = easeOutQuad(a.progress);
        if (a.progress >= 1) {
          _anims.splice(i, 1);
        }
      }

      if (!_anims.length) {
        _animating = false;
      }
    },

    // ---- Rendering ----
    render: function (t) {
      if (!_state || !_level) return;
      var ctx = _ctx;

      ctx.clearRect(0, 0, _canvas.width, _canvas.height);

      // Layer 1: Floor + Walls (from cache)
      if (_floorCache) {
        ctx.drawImage(_floorCache, 0, 0);
      }

      // Layer 2: Sigils (with pulse)
      var pulse = 0.6 + 0.4 * Math.sin(t * SIGIL_PULSE_SPEED);
      for (var tk in _level.targets) {
        var parts = tk.split(',');
        var sx = parseInt(parts[0]) * TILE;
        var sy = parseInt(parts[1]) * TILE;
        var sealed = !!_state.stones[tk];
        Game.drawSigil(ctx, sx, sy, pulse, sealed, t);
      }

      // Layer 3: Shadows (account for animation)
      for (var sk in _state.stones) {
        var sp = sk.split(',');
        var sPx = parseInt(sp[0]) * TILE;
        var sPy = parseInt(sp[1]) * TILE;
        // Check if this stone is animating
        var stoneAnim = Game.findAnim('stone', sk);
        if (stoneAnim) {
          sPx = (stoneAnim.fromX + (stoneAnim.toX - stoneAnim.fromX) * stoneAnim.progress) * TILE;
          sPy = (stoneAnim.fromY + (stoneAnim.toY - stoneAnim.fromY) * stoneAnim.progress) * TILE;
        }
        Game.drawShadow(ctx, sPx, sPy);
      }

      // Player shadow
      var playerDrawX = _state.player.x * TILE;
      var playerDrawY = _state.player.y * TILE;
      var playerAnim = Game.findAnim('player');
      if (playerAnim) {
        playerDrawX = (playerAnim.fromX + (playerAnim.toX - playerAnim.fromX) * playerAnim.progress) * TILE;
        playerDrawY = (playerAnim.fromY + (playerAnim.toY - playerAnim.fromY) * playerAnim.progress) * TILE;
      }
      Game.drawShadow(ctx, playerDrawX, playerDrawY);

      // Layer 4: Runestones
      for (var rk in _state.stones) {
        var rp = rk.split(',');
        var rx = parseInt(rp[0]) * TILE;
        var ry = parseInt(rp[1]) * TILE;
        var onTarget = !!_level.targets[rk];

        // Check animation
        var rAnim = Game.findAnim('stone', rk);
        if (rAnim) {
          rx = (rAnim.fromX + (rAnim.toX - rAnim.fromX) * rAnim.progress) * TILE;
          ry = (rAnim.fromY + (rAnim.toY - rAnim.fromY) * rAnim.progress) * TILE;
        }
        Game.drawStone(ctx, rx, ry, onTarget, t);
      }

      // Layer 5: Player
      Game.drawPlayer(ctx, playerDrawX, playerDrawY, t);

      // Layer 6: Active spell indicator
      if (_activeSpell) {
        Game.drawSpellIndicator(ctx, playerDrawX, playerDrawY, t);
      }

      // Layer 7: Particles
      drawDustParticles(ctx);
      drawParticles(ctx);

      // Layer 8: Spell flash overlay
      if (_spellFlash) {
        var flashElapsed = t - _spellFlash.startTime;
        var flashAlpha = 1 - (flashElapsed / _spellFlash.duration);
        if (flashAlpha > 0) {
          ctx.save();
          ctx.fillStyle = _spellFlash.color + (flashAlpha * 0.15) + ')';
          ctx.fillRect(0, 0, _canvas.width, _canvas.height);
          ctx.restore();
        } else {
          _spellFlash = null;
        }
      }
    },

    findAnim: function (type, entityKey) {
      for (var i = 0; i < _anims.length; i++) {
        if (_anims[i].type === type) {
          if (entityKey && _anims[i].key !== entityKey) continue;
          return _anims[i];
        }
      }
      return null;
    },

    drawFloor: function (ctx, x, y, gx, gy) {
      drawFloorTile(ctx, x, y, gx, gy);
    },

    drawWall: function (ctx, x, y) {
      // Used by cache builder
    },

    drawSigil: function (ctx, x, y, pulse, sealed, t) {
      if (_images.sigil) {
        ctx.save();
        ctx.globalAlpha = sealed ? 0.4 : pulse;
        ctx.drawImage(_images.sigil, x, y, TILE, TILE);
        ctx.restore();
        return;
      }

      var cx = x + TILE / 2;
      var cy = y + TILE / 2;
      var r = TILE * 0.32;

      // Outer glow
      if (!sealed) {
        ctx.save();
        ctx.globalAlpha = pulse * 0.2;
        ctx.fillStyle = C.sigilGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Outer ring
      ctx.save();
      ctx.globalAlpha = sealed ? 0.3 : pulse * 0.8;
      ctx.strokeStyle = sealed ? C.sealed : C.sigil;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Inner 4-pointed star / diamond
      ctx.fillStyle = sealed ? C.sealed : C.sigil;
      ctx.globalAlpha = sealed ? 0.2 : pulse * 0.5;
      var ir = r * 0.55;
      ctx.beginPath();
      ctx.moveTo(cx, cy - ir);        // top
      ctx.lineTo(cx + ir * 0.4, cy);   // right
      ctx.lineTo(cx, cy + ir);        // bottom
      ctx.lineTo(cx - ir * 0.4, cy);   // left
      ctx.closePath();
      ctx.fill();

      // Rotated diamond overlay
      ctx.beginPath();
      ctx.moveTo(cx - ir, cy);
      ctx.lineTo(cx, cy - ir * 0.4);
      ctx.lineTo(cx + ir, cy);
      ctx.lineTo(cx, cy + ir * 0.4);
      ctx.closePath();
      ctx.fill();

      // 4 cardinal dots
      ctx.globalAlpha = sealed ? 0.2 : pulse * 0.7;
      ctx.fillStyle = sealed ? C.sealed : C.sigilGlow;
      var dotR = 2;
      var dotDist = r * 0.78;
      ctx.beginPath(); ctx.arc(cx, cy - dotDist, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + dotDist, cy, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy + dotDist, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - dotDist, cy, dotR, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    },

    drawShadow: function (ctx, x, y) {
      ctx.save();
      ctx.fillStyle = C.shadow;
      ctx.beginPath();
      ctx.ellipse(x + TILE / 2, y + TILE - 4, TILE * 0.35, TILE * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },

    drawStone: function (ctx, x, y, onTarget, t) {
      if (_images.runestone) {
        ctx.drawImage(_images.runestone, x, y, TILE, TILE);
        if (onTarget) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = C.sealed;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.restore();
        }
        return;
      }

      // Subtle bob
      var bob = Math.sin((t || 0) * 0.003) * 1.2;
      var yOff = y + bob;

      var pad = 7;
      var bw = TILE - pad * 2;
      var bh = TILE - pad * 2 - 4;
      var bx = x + pad;
      var by = yOff + pad;
      var radius = 4;

      // Body with gradient effect — themed stone colors
      var bodyColor = onTarget ? '#5a8a5a' : T.stone;
      var topColor = onTarget ? '#70a470' : T.stoneTop;
      var darkColor = onTarget ? '#4a6a4a' : T.stoneDark;

      // Bottom (darker) face
      ctx.fillStyle = darkColor;
      Game.roundRect(ctx, bx, by + 3, bw, bh, radius);
      ctx.fill();

      // Main body
      ctx.fillStyle = bodyColor;
      Game.roundRect(ctx, bx, by, bw, bh - 3, radius);
      ctx.fill();

      // Top lighter face
      ctx.fillStyle = topColor;
      Game.roundRect(ctx, bx + 1, by + 1, bw - 2, bh * 0.4, radius - 1);
      ctx.fill();

      // Carved rune symbol (diamond + cross)
      var rcx = x + TILE / 2;
      var rcy = yOff + TILE / 2 - 1;
      ctx.fillStyle = onTarget ? C.sealed : 'rgba(201,168,76,0.45)';

      // Diamond
      ctx.beginPath();
      ctx.moveTo(rcx, rcy - 6);
      ctx.lineTo(rcx + 5, rcy);
      ctx.lineTo(rcx, rcy + 6);
      ctx.lineTo(rcx - 5, rcy);
      ctx.closePath();
      ctx.fill();

      // Cross lines
      ctx.strokeStyle = onTarget ? C.sealed : 'rgba(201,168,76,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rcx - 7, rcy); ctx.lineTo(rcx + 7, rcy);
      ctx.moveTo(rcx, rcy - 7); ctx.lineTo(rcx, rcy + 7);
      ctx.stroke();

      // On-target glow
      if (onTarget) {
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin((t || 0) * 0.004) * 0.05;
        ctx.shadowColor = C.sealed;
        ctx.shadowBlur = 10;
        ctx.fillStyle = C.sealed;
        Game.roundRect(ctx, bx, by, bw, bh - 3, radius);
        ctx.fill();
        ctx.restore();
      }
    },

    roundRect: function (ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    },

    drawPlayer: function (ctx, x, y, t) {
      if (_images.player && _playerFrameW > 0) {
        var dirRow = 0;
        if (_state.facing.dy > 0) dirRow = 0;
        else if (_state.facing.dx < 0) dirRow = 1;
        else if (_state.facing.dx > 0) dirRow = 2;
        else if (_state.facing.dy < 0) dirRow = 3;

        ctx.drawImage(
          _images.player,
          0, dirRow * _playerFrameH,
          _playerFrameW, _playerFrameH,
          x, y, TILE, TILE
        );
        return;
      }

      // Breathing animation
      var breathe = 1 + Math.sin(t * 0.004) * 0.015;
      var cx = x + TILE / 2;

      // Hooded cloak (triangle)
      var cloakTop = y + 4;
      var cloakBot = y + TILE - 6;
      var cloakW = TILE * 0.45 * breathe;

      // Cloak body (dark)
      ctx.fillStyle = C.playerCloakDark;
      ctx.beginPath();
      ctx.moveTo(cx, cloakTop);
      ctx.lineTo(cx + cloakW, cloakBot);
      ctx.lineTo(cx - cloakW, cloakBot);
      ctx.closePath();
      ctx.fill();

      // Cloak front (lighter)
      ctx.fillStyle = C.playerCloak;
      ctx.beginPath();
      ctx.moveTo(cx, cloakTop + 2);
      ctx.lineTo(cx + cloakW * 0.75, cloakBot);
      ctx.lineTo(cx - cloakW * 0.75, cloakBot);
      ctx.closePath();
      ctx.fill();

      // Gold trim on cloak edges
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cloakTop);
      ctx.lineTo(cx + cloakW, cloakBot);
      ctx.moveTo(cx, cloakTop);
      ctx.lineTo(cx - cloakW, cloakBot);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Hood (pointed top arc)
      var hoodCY = y + TILE * 0.32;
      var hoodR = TILE * 0.22;
      ctx.fillStyle = C.playerCloak;
      ctx.beginPath();
      ctx.arc(cx, hoodCY, hoodR, 0, Math.PI * 2);
      ctx.fill();

      // Hood point (triangle on top)
      ctx.fillStyle = C.playerCloakDark;
      ctx.beginPath();
      ctx.moveTo(cx, cloakTop - 1);
      ctx.lineTo(cx + hoodR * 0.6, hoodCY - hoodR * 0.3);
      ctx.lineTo(cx - hoodR * 0.6, hoodCY - hoodR * 0.3);
      ctx.closePath();
      ctx.fill();

      // Face (visible beneath hood)
      var faceR = hoodR * 0.65;
      ctx.fillStyle = C.playerFace;
      ctx.beginPath();
      ctx.arc(cx, hoodCY + 1, faceR, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (tracking facing direction)
      ctx.fillStyle = C.playerEye;
      var eox = _state.facing.dx * 2.5;
      var eoy = _state.facing.dy * 1.5;
      ctx.fillRect(cx - 3.5 + eox, hoodCY - 0.5 + eoy, 2.5, 2.5);
      ctx.fillRect(cx + 1.5 + eox, hoodCY - 0.5 + eoy, 2.5, 2.5);
    },

    drawSpellIndicator: function (ctx, x, y, t) {
      var colors = {
        tether: 'rgba(155,109,204,',
        transpose: 'rgba(76,201,168,',
        ghostwalk: 'rgba(204,136,68,'
      };
      var colorBase = colors[_activeSpell] || 'rgba(255,255,255,';

      ctx.save();

      // Pulsing border
      var indicPulse = 0.3 + 0.15 * Math.sin(t * 0.008);
      ctx.strokeStyle = colorBase + indicPulse + ')';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.setLineDash([]);

      // Direction arrow
      if (_state.facing.dx !== 0 || _state.facing.dy !== 0) {
        var acx = x + TILE / 2;
        var acy = y + TILE / 2;
        var ax = acx + _state.facing.dx * TILE * 0.4;
        var ay = acy + _state.facing.dy * TILE * 0.4;
        ctx.strokeStyle = colorBase + '0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(acx, acy);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        var angle = Math.atan2(_state.facing.dy, _state.facing.dx);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 6 * Math.cos(angle - 0.5), ay - 6 * Math.sin(angle - 0.5));
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 6 * Math.cos(angle + 0.5), ay - 6 * Math.sin(angle + 0.5));
        ctx.stroke();
      }
      ctx.restore();
    },

    // ---- Accessors ----
    getState: function () { return _state; },
    getLevel: function () { return _level; },
    getActiveSpell: function () { return _activeSpell; },
    setActiveSpell: function (s) { _activeSpell = s; },
    canUndo: function () { return _undoStack.length > 0; },

    onWin: function (cb) { _onWin = cb; },
    onStateChange: function (cb) { _onStateChange = cb; },

    getUndoCount: function () { return _undoStack.length; },

    destroy: function () {
      Game.stopRenderLoop();
      _state = null;
      _level = null;
      _undoStack = [];
      _anims = [];
      _particles = [];
      _dustParticles = [];
      _floorCache = null;
    }
  };

  window.Game = Game;
})();
