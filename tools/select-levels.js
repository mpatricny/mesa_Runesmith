/**
 * select-levels.js — One-time Node.js script
 * Downloads Microban/Sasquatch collections, selects 96 levels, outputs JS
 * Usage: node tools/select-levels.js > levels-output.json
 */

var https = require('https');

var URLS = [
  { name: 'microban1', url: 'https://raw.githubusercontent.com/dangarfield/sokoban-solver/master/grids/Microban.txt' },
  { name: 'microban2', url: 'https://raw.githubusercontent.com/dangarfield/sokoban-solver/master/grids/Microban%20II.txt' },
  { name: 'microban3', url: 'https://raw.githubusercontent.com/dangarfield/sokoban-solver/master/grids/Microban%20III.txt' },
  { name: 'microban4', url: 'https://raw.githubusercontent.com/dangarfield/sokoban-solver/master/grids/Microban%20IV.txt' },
  { name: 'sasquatch', url: 'https://raw.githubusercontent.com/dangarfield/sokoban-solver/master/grids/Sasquatch.txt' }
];

var MAX_WIDTH = 14;
var MAX_HEIGHT = 12;
var MAX_BOXES = 6;

function fetch(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      var data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () { resolve(data); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseLevelsXSB(text) {
  var lines = text.split(/\r?\n/);
  var levels = [];
  var current = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Level line: contains # and level chars
    if (line.indexOf('#') >= 0 && line.match(/^[#@$.*+ \t]+$/)) {
      current.push(line);
      continue;
    }

    // Continuation line: inside a level block, valid chars only
    if (current.length > 0 && line.match(/^[#@$.*+ \t]+$/) && line.trim().length > 0) {
      current.push(line);
      continue;
    }

    // End of level block
    if (current.length > 0) {
      levels.push({ rows: current.slice() });
      current = [];
    }
  }

  if (current.length > 0) {
    levels.push({ rows: current.slice() });
  }

  return levels;
}

function analyzeLevel(level) {
  var rows = level.rows;
  var height = rows.length;
  var width = 0;
  var boxes = 0;
  var goals = 0;
  var hasPlayer = false;

  for (var y = 0; y < height; y++) {
    var trimmed = rows[y].replace(/\s+$/, '');
    if (trimmed.length > width) width = trimmed.length;
    for (var x = 0; x < rows[y].length; x++) {
      var ch = rows[y][x];
      if (ch === '$') boxes++;
      if (ch === '*') { boxes++; goals++; }
      if (ch === '.') goals++;
      if (ch === '+') { hasPlayer = true; goals++; }
      if (ch === '@') hasPlayer = true;
    }
  }

  return {
    width: width,
    height: height,
    boxes: boxes,
    goals: goals,
    hasPlayer: hasPlayer,
    valid: hasPlayer && boxes === goals && boxes > 0
  };
}

function convertXSBToGame(rows) {
  var maxWidth = 0;
  for (var i = 0; i < rows.length; i++) {
    var trimmed = rows[i].replace(/\s+$/, '');
    if (trimmed.length > maxWidth) maxWidth = trimmed.length;
  }

  var result = [];
  for (var y = 0; y < rows.length; y++) {
    var row = rows[y];
    var converted = '';
    for (var x = 0; x < maxWidth; x++) {
      var ch = x < row.length ? row[x] : ' ';
      switch (ch) {
        case ' ': converted += '.'; break;
        case '.': converted += 'O'; break;
        case '+': converted += '+'; break;
        case '*': converted += '*'; break;
        default:  converted += ch; break;
      }
    }
    result.push(converted);
  }
  return result;
}

function generateName(index, locationId) {
  var prefixes = [
    ['Stone', 'Rune', 'Iron', 'Ember', 'Ward', 'Gate', 'Path', 'Hall', 'Arch', 'Mark',
     'Lock', 'Dust', 'Shard', 'Glyph', 'Forge', 'Vault', 'Flame', 'Core', 'Drift', 'Basalt'],
    ['Shadow', 'Bone', 'Crypt', 'Echo', 'Dusk', 'Veil', 'Tomb', 'Wraith', 'Grave', 'Hollow',
     'Ashen', 'Silent', 'Dread', 'Dark', 'Pale', 'Lost', 'Deep', 'Still', 'Grey', 'Cold'],
    ['Frost', 'Ice', 'Glacier', 'Crystal', 'Chill', 'Sleet', 'Hail', 'Snow', 'Rime', 'Winter',
     'Frozen', 'White', 'Sheer', 'Glass', 'Brisk', 'Polar', 'Stark', 'Clear', 'Azure', 'Silver'],
    ['Ember', 'Flame', 'Cinder', 'Blaze', 'Forge', 'Pyre', 'Scorch', 'Ash', 'Smelt', 'Furnace',
     'Molten', 'Flare', 'Spark', 'Coal', 'Heat', 'Char', 'Brand', 'Sear', 'Torch', 'Bane'],
    ['Void', 'Abyss', 'Rift', 'Null', 'End', 'Omega', 'Final', 'Last', 'Doom', 'Dusk',
     'Fade', 'Wane', 'Brink', 'Edge', 'Apex', 'Peak', 'Rend', 'Sever', 'Break', 'Crack']
  ];
  var suffixes = [
    'Chamber', 'Passage', 'Hall', 'Vault', 'Gate', 'Ward', 'Path', 'Crossing',
    'Puzzle', 'Trial', 'Test', 'Lock', 'Riddle', 'Maze', 'Keep', 'Room',
    'Cell', 'Quarter', 'Alcove', 'Nook'
  ];
  var locPrefixes = prefixes[locationId - 1] || prefixes[0];
  return locPrefixes[index % locPrefixes.length] + ' ' + suffixes[index % suffixes.length];
}

function getSealName(locationId) {
  return ['Seal the Tower', 'Seal the Crypts', 'Seal the Spire', 'Seal the Sanctum', 'Seal the Final Breach'][locationId - 1];
}

async function main() {
  process.stderr.write('Downloading collections...\n');

  // Download all collections
  var allFiltered = []; // flat list of all qualifying levels with source info
  for (var u = 0; u < URLS.length; u++) {
    process.stderr.write('  Fetching ' + URLS[u].name + '...\n');
    var text = await fetch(URLS[u].url);
    var parsed = parseLevelsXSB(text);
    process.stderr.write('    Parsed ' + parsed.length + ' levels\n');

    var count = 0;
    for (var i = 0; i < parsed.length; i++) {
      var info = analyzeLevel(parsed[i]);
      if (info.valid && info.width <= MAX_WIDTH && info.height <= MAX_HEIGHT && info.boxes <= MAX_BOXES) {
        allFiltered.push({
          level: parsed[i],
          info: info,
          source: URLS[u].name,
          sourceIndex: u,
          originalIndex: i
        });
        count++;
      }
    }
    process.stderr.write('    ' + count + ' pass filter\n');
  }

  process.stderr.write('Total qualifying: ' + allFiltered.length + '\n');

  // Assign levels to tiers based on source and position
  // Strategy: walk through allFiltered in order (already sorted by collection, then by position)
  // Split into 5 tiers: 16, 20, 20, 20, 20
  var tierSizes = [16, 20, 20, 20, 20];
  var tiers = [[], [], [], [], []];
  var used = new Set();

  // Preferred sources per tier (in order of preference)
  var tierSources = [
    ['microban1'],                      // Tier 1: easy (MB1 early)
    ['microban1', 'microban2'],         // Tier 2: medium
    ['microban2', 'microban3'],         // Tier 3: med-hard
    ['microban3', 'microban4'],         // Tier 4: hard
    ['microban4', 'sasquatch', 'microban3'] // Tier 5: expert (backfill from MB3)
  ];

  // For each tier, grab levels from preferred sources in order
  for (var t = 0; t < 5; t++) {
    var needed = tierSizes[t];
    var sources = tierSources[t];

    for (var s = 0; s < sources.length && tiers[t].length < needed; s++) {
      var srcName = sources[s];
      // For tier 0, skip first 2 from MB1 (too trivial, similar to tutorials)
      // For later tiers pulling from same source, skip levels already assigned to earlier tiers
      for (var i = 0; i < allFiltered.length && tiers[t].length < needed; i++) {
        var entry = allFiltered[i];
        if (entry.source !== srcName) continue;
        if (used.has(i)) continue;
        // For tier 1, skip very first MB1 levels (trivial)
        if (t === 0 && srcName === 'microban1' && entry.originalIndex < 2) {
          used.add(i);
          continue;
        }
        tiers[t].push(entry);
        used.add(i);
      }
    }
    process.stderr.write('Tier ' + (t+1) + ': ' + tiers[t].length + '/' + needed + '\n');
  }

  // If any tier is still short, backfill from any unused level
  for (var t = 0; t < 5; t++) {
    if (tiers[t].length < tierSizes[t]) {
      for (var i = 0; i < allFiltered.length && tiers[t].length < tierSizes[t]; i++) {
        if (!used.has(i)) {
          tiers[t].push(allFiltered[i]);
          used.add(i);
        }
      }
      process.stderr.write('Tier ' + (t+1) + ' after backfill: ' + tiers[t].length + '/' + tierSizes[t] + '\n');
    }
  }

  // Build output
  var chargesPerTier = [
    { tether: 2, transpose: 0, ghostwalk: 0 },
    { tether: 3, transpose: 2, ghostwalk: 0 },
    { tether: 3, transpose: 3, ghostwalk: 2 },
    { tether: 3, transpose: 3, ghostwalk: 3 },
    { tether: 3, transpose: 3, ghostwalk: 3 }
  ];

  var output = [];
  for (var t = 0; t < 5; t++) {
    var locationId = t + 1;
    var tier = tiers[t];
    for (var l = 0; l < tier.length; l++) {
      var isLast = (l === tier.length - 1);
      output.push({
        name: isLast ? getSealName(locationId) : generateName(l, locationId),
        map: convertXSBToGame(tier[l].level.rows),
        charges: { tether: chargesPerTier[t].tether, transpose: chargesPerTier[t].transpose, ghostwalk: chargesPerTier[t].ghostwalk },
        location: locationId,
        isTutorial: false,
        isBreachSeal: isLast
      });
    }
  }

  process.stderr.write('\nTotal output: ' + output.length + ' levels\n');
  console.log(JSON.stringify(output, null, 2));
}

main().catch(function (err) {
  process.stderr.write('Error: ' + err.stack + '\n');
  process.exit(1);
});
