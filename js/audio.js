/**
 * Audio - Procedural sound effects via Web Audio API
 */
(function () {
  'use strict';

  var _ctx = null;
  var _muted = false;

  function ensureContext() {
    if (!_ctx) {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_ctx.state === 'suspended') {
      _ctx.resume();
    }
    return _ctx;
  }

  function playTone(freq, duration, type, vol, ramp) {
    if (_muted) return;
    var ctx = ensureContext();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (ramp) {
      osc.frequency.linearRampToValueAtTime(ramp, ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function playNoise(duration, vol) {
    if (_muted) return;
    var ctx = ensureContext();
    var bufferSize = ctx.sampleRate * duration;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  var Audio = {
    init: function () {
      // Context created lazily on first interaction
    },

    playStep: function () {
      playNoise(0.08, 0.06);
      playTone(200, 0.06, 'sine', 0.04);
    },

    playPush: function () {
      playNoise(0.12, 0.08);
      playTone(150, 0.15, 'triangle', 0.08);
    },

    playSpellCast: function (type) {
      switch (type) {
        case 'tether':
          playTone(440, 0.15, 'sine', 0.12);
          playTone(660, 0.2, 'sine', 0.1);
          break;
        case 'transpose':
          playTone(330, 0.1, 'square', 0.08);
          playTone(550, 0.15, 'sine', 0.1);
          playTone(330, 0.1, 'sine', 0.08);
          break;
        case 'ghostwalk':
          playTone(500, 0.3, 'sine', 0.06, 300);
          playTone(700, 0.2, 'triangle', 0.04);
          break;
      }
    },

    playSealComplete: function () {
      var delay = 0;
      [523, 659, 784, 1047].forEach(function (f) {
        setTimeout(function () {
          playTone(f, 0.3, 'sine', 0.12);
        }, delay);
        delay += 120;
      });
    },

    playUndo: function () {
      playTone(300, 0.1, 'triangle', 0.06, 200);
    },

    playError: function () {
      playTone(150, 0.15, 'square', 0.08);
      playTone(120, 0.15, 'square', 0.06);
    },

    playUIClick: function () {
      playTone(800, 0.05, 'sine', 0.06);
    },

    playLevelStart: function () {
      playTone(400, 0.15, 'sine', 0.08);
      playTone(500, 0.15, 'sine', 0.06);
    },

    setMuted: function (m) {
      _muted = m;
    },

    isMuted: function () {
      return _muted;
    }
  };

  window.Audio = Audio;
})();
