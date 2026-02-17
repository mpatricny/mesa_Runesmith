/**
 * i18n - Internationalization module
 * Simple key-based string lookup with fallback to English
 */
(function () {
  'use strict';

  var _lang = 'en';

  var _strings = {
    en: {
      title: 'Runesmith',
      subtitle: 'Seal the Breach',
      play: 'Play',
      levelSelect: 'Level Select',
      back: 'Back',
      level: 'Level',
      moves: 'Moves',
      spells: 'Spells',
      undo: 'Undo',
      restart: 'Restart',
      menu: 'Menu',
      next: 'Next',
      sealComplete: 'Seal Complete!',
      stars: 'Stars',
      tether: 'Rune Tether',
      transpose: 'Transpose',
      ghostwalk: 'Ghostwalk',
      tetherDesc: 'Pull a distant runestone one tile toward you.',
      transposeDesc: 'Swap positions with an adjacent runestone.',
      ghostwalkDesc: 'Phase through an adjacent runestone.',
      spellUnlocked: 'New Spell Unlocked!',
      locked: 'Locked',
      completed: 'Completed',
      totalStars: 'Total Stars',
      noCharges: 'No charges remaining!',
      spellBlocked: 'Cannot cast spell here!',
      campaignComplete: 'Campaign Complete!',
      campaignCompleteMsg: 'You have sealed the breach. The realm is safe.',
      parMoves: 'Par',
      yourMoves: 'Your Moves',
      yourSpells: 'Spells Used',
      bestStars: 'Best'
    }
  };

  var I18n = {
    init: function (lang) {
      _lang = lang || 'en';
    },

    t: function (key) {
      var dict = _strings[_lang] || _strings.en;
      return dict[key] || _strings.en[key] || key;
    },

    setLang: function (lang) {
      _lang = lang;
    },

    getLang: function () {
      return _lang;
    }
  };

  window.I18n = I18n;
})();
