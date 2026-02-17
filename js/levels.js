/**
 * Levels - 100-level campaign across 5 breach locations
 * Levels 1-4: Tutorial levels introducing core mechanics
 * Levels 5-100: Adapted from Microban/Sasquatch collections by David W. Skinner
 * Original puzzles may be freely distributed with proper credit
 */
(function () {
  'use strict';

  var LOCATIONS = [
    { id: 1, name: "The Runesmith's Tower", startLevel: 1, endLevel: 20 },
    { id: 2, name: "The Sunken Crypts", startLevel: 21, endLevel: 40 },
    { id: 3, name: "The Frozen Spire", startLevel: 41, endLevel: 60 },
    { id: 4, name: "The Ember Sanctum", startLevel: 61, endLevel: 80 },
    { id: 5, name: "The Final Breach", startLevel: 81, endLevel: 100 }
  ];

  var BREACH_SEAL_GATE = 40;

  var LEVEL_DATA = [
    // ===== LOCATION 1: The Runesmith's Tower (1-20) =====
    // Level 1: Tutorial — First Push
    { name: "First Push", map: ['#######', '#@.$.O#', '#######'], charges: { tether: 0, transpose: 0, ghostwalk: 0 }, location: 1, isTutorial: true },
    // Level 2: Tutorial — Rune Tether
    { name: "Rune Tether", map: ['#######', '#O...$#', '#....@#', '#######'], charges: { tether: 1, transpose: 0, ghostwalk: 0 }, location: 1, isTutorial: true },
    // Level 3: Tutorial — Ghostwalk
    { name: "Ghostwalk", map: ['##########', '#O..@..$.#', '##########'], charges: { tether: 1, transpose: 0, ghostwalk: 1 }, location: 1, isTutorial: true },
    // Level 4: Tutorial — Transpose
    { name: "Transpose", map: ['########', '#O.@..$#', '########'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1, isTutorial: true },
    { name: "Ember Vault", map: ['######.#####', '#....###...#', '#.$$.....#@#', '#.$.#OOO...#', '#...########', '#####.......'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Ward Gate", map: ['#######', '#.....#', '#.O$O.#', '#.$O$.#', '#.O$O.#', '#.$O$.#', '#..@..#', '#######'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Hall Crossing", map: ['......#####', '......#O..#', '......#O#.#', '#######O#.#', '#.@.$.$.$.#', '#.#.#.#.###', '#.......#..', '#########..'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Lock Test", map: ['####...', '#O.##..', '#O@.#..', '#O.$#..', '##$.###', '.#.$..#', '.#....#', '.#..###', '.####..'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Dust Lock", map: ['#######', '#.....#', '#.#.#.#', '#O.$*@#', '#...###', '#####..'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Shard Riddle", map: ['.....###.', '######@##', '#....O*.#', '#...#...#', '#####$#.#', '....#...#', '....#####'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Glyph Maze", map: ['.####.....', '.#..####..', '.#.....##.', '##.##...#.', '#O.O#.@$##', '#...#.$$.#', '#..O#....#', '##########'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Forge Keep", map: ['#####.', '#.@.#.', '#OOO#.', '#$$$##', '#....#', '#....#', '######'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Core Crossing", map: ['#######', '#.....#', '#O.O..#', '#.##.##', '#..$.#.', '###$.#.', '..#@.#.', '..#..#.', '..####.'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Stone Chamber", map: ['..####...', '###..####', '#.....$.#', '#.#..#$.#', '#.O.O#@.#', '#########'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Rune Passage", map: ['########', '#......#', '#.O**$@#', '#......#', '#####..#', '....####'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Iron Hall", map: ['.#######', '.#.....#', '.#.O$O.#', '##.$@$.#', '#..O$O.#', '#......#', '########'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Path Path", map: ['#####.', '#O..##', '#@$$.#', '##...#', '.##..#', '..##O#', '...###'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Arch Puzzle", map: ['..######.', '..#....#.', '..#.##@##', '###.#.$.#', '#.OO#.$.#', '#.......#', '#..######', '####.....'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Mark Trial", map: ['#####....', '#...##...', '#.$..#...', '##.$.####', '.###@O..#', '..#..O#.#', '..#.....#', '..#######'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1 },
    { name: "Seal the Tower", map: ['..######', '..#.OO@#', '..#.$$.#', '..##.###', '...#.#..', '...#.#..', '####.#..', '#....##.', '#.#...#.', '#...#.#.', '###...#.', '..#####.'], charges: { tether: 1, transpose: 1, ghostwalk: 1 }, location: 1, isBreachSeal: true },

    // ===== LOCATION 2: The Sunken Crypts (21-40) =====
    { name: "Shadow Chamber", map: ['########', '#...OO.#', '#..@$$.#', '#####.##', '...#..#.', '...#..#.', '...#..#.', '...####.'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Bone Passage", map: ['#######..', '#.....###', '#..@$$OO#', '####.##.#', '..#.....#', '..#..####', '..#..#...', '..####...'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Crypt Hall", map: ['####...', '#..####', '#.O.O.#', '#.$$#@#', '##....#', '.######'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Echo Vault", map: ['#####..', '#...###', '#O.O..#', '#...#.#', '##.#..#', '.#@$$.#', '.#....#', '.#..###', '.####..'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Dusk Gate", map: ['#######', '#..*..#', '#.....#', '##.#.##', '.#$@O#.', '.#...#.', '.#####.'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Veil Ward", map: ['#.#####', '..#...#', '###$$@#', '#...###', '#.....#', '#.O.O.#', '#######'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Tomb Path", map: ['.####..', '.#..###', '.#.$$.#', '##OOO.#', '#..@$.#', '#...###', '#####..'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Wraith Crossing", map: ['.#####', '.#.@.#', '.#...#', '###$.#', '#.OOO#', '#.$$.#', '###..#', '..####'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Grave Puzzle", map: ['######.', '#...O#.', '#.##.##', '#..$$@#', '#.#...#', '#O..###', '#####..'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Hollow Trial", map: ['#####..', '#...#..', '#.@.#..', '#.$$###', '##O.O.#', '.#....#', '.######'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Ashen Test", map: ['.....#####.', '.....#...##', '.....#....#', '.######...#', '##.....#O.#', '#.$.$.@..##', '#.######O#.', '#........#.', '##########.'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Silent Lock", map: ['####..', '#..###', '#.$$.#', '#OOO.#', '#.@$.#', '#...##', '#####.'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Dread Riddle", map: ['..####.', '.##..#.', '##@$O##', '#.$$..#', '#.O.O.#', '###...#', '..#####'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Dark Maze", map: ['.####..', '##..###', '#.....#', '#O**$@#', '#...###', '##..#..', '.####..'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Pale Keep", map: ['#######', '#O.#..#', '#..$..#', '#O.$#@#', '#..$..#', '#O.#..#', '#######'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Lost Room", map: ['..####...', '###..####', '#.......#', '#@$***O.#', '#.......#', '#########'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Deep Cell", map: ['.####.', '##..#.', '#O.$#.', '#O$.#.', '#O$.#.', '#O$.#.', '#O.$##', '#...@#', '##...#', '.#####'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Still Quarter", map: ['......###', '#####.#O#', '#...###O#', '#...$.#O#', '#.$..$..#', '#####@#.#', '....#...#', '....#####'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Grey Alcove", map: ['##########', '#........#', '#.##O###.#', '#.#.$$.O.#', '#.O.@$##.#', '#####....#', '....######'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2 },
    { name: "Seal the Crypts", map: ['#####.....', '#...####..', '#.#.#.O#..', '#....$.###', '###.#$O..#', '#...#@...#', '#.#.######', '#...#.....', '#####.....'], charges: { tether: 3, transpose: 2, ghostwalk: 0 }, location: 2, isBreachSeal: true },

    // ===== LOCATION 3: The Frozen Spire (41-60) =====
    { name: "Frost Chamber", map: ['####..', '#..#..', '#..#..', '#..###', '#O$$@#', '#..O.#', '#..###', '####..'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Ice Passage", map: ['.#####', '.#...#', '##O#.#', '#..@.#', '#..$.#', '#.#*##', '#...#.', '#####.'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Glacier Hall", map: ['...####', '####..#', '#..#..#', '#.O.O.#', '#.@$$.#', '#.#.###', '#...#..', '#####..'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Crystal Vault", map: ['.#####....', '##.@.####.', '#..#..O.##', '#.#......#', '#.$$.#O..#', '##....####', '.##...#...', '..#####...'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Chill Gate", map: ['######..', '#....#..', '#.$$.###', '###.@..#', '..#..O.#', '..##.O##', '...####.'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Sleet Ward", map: ['...####..', '####..#..', '#@O*..#..', '#..#..###', '####..$.#', '...#..#.#', '...##...#', '....#####'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Hail Path", map: ['..#####', '###...#', '#..$#.#', '#..O$.#', '##.##O#', '.#...@#', '.######'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Snow Crossing", map: ['########', '#...@..#', '#...*..#', '###O$###', '..#.*.#.', '..#...#.', '..#####.'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Rime Puzzle", map: ['######', '#....#', '#.#$@#', '#.O*O#', '#.#$.#', '#....#', '######'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Winter Trial", map: ['#####..', '#...#..', '#...###', '#$$$@.#', '#OOO..#', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Frozen Test", map: ['######', '#O#..#', '#@$$.#', '#OO$.#', '##...#', '.#####'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "White Lock", map: ['.#######', '.#..#..#', '.#..#$.#', '##..O*+#', '#...#$.#', '#...#..#', '##..####', '.#..#...', '.####...'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Sheer Riddle", map: ['#####..', '#...###', '#.....#', '#.....#', '###O###', '#.$*$.#', '#..+..#', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Glass Maze", map: ['.####..', '##..###', '#.O$..#', '#@O$..#', '#.O$.##', '##..##.', '.####..'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Brisk Keep", map: ['####...', '#..####', '#..#..#', '#O$**@#', '##....#', '.#...##', '.#####.'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Polar Room", map: ['....####', '..###..#', '..#.$$.#', '.##.#..#', '##.O#$@#', '#......#', '#.OO####', '#####...'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Stark Cell", map: ['.#####', '.#...#', '.#$#@#', '##.$.#', '#...##', '#O*O.#', '#....#', '######'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Clear Quarter", map: ['.#####.', '.#...##', '.#$#@.#', '.#.$..#', '##..###', '#.$O..#', '#O.O..#', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Azure Alcove", map: ['#######', '#.....#', '#.$$$O#', '##.#@O#', '.#.#.O#', '.#..#.#', '.##...#', '..#####'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3 },
    { name: "Seal the Spire", map: ['.####..', '.#..###', '.#$...#', '.#.O#.#', '##*O..#', '#.$.###', '#.@.#..', '#####..'], charges: { tether: 3, transpose: 3, ghostwalk: 2 }, location: 3, isBreachSeal: true },

    // ===== LOCATION 4: The Ember Sanctum (61-80) =====
    { name: "Ember Chamber", map: ['####....', '#..#....', '#..#....', '#..#####', '#O$$.$@#', '#..O.O.#', '#..#####', '####....'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Flame Passage", map: ['..####.', '###..#.', '#.$O@##', '#..*..#', '#..*..#', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Cinder Hall", map: ['#######', '#.....#', '#.O$..#', '##O$###', '#..@..#', '#.O$#.#', '#.....#', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Blaze Vault", map: ['######', '#..@.#', '#.#$.#', '#.O*O#', '###$.#', '#..*.#', '#....#', '###..#', '..####'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Forge Gate", map: ['######....', '#....#####', '#...$.$..#', '###$OOO@.#', '..#..#####', '..####....'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Pyre Ward", map: ['########', '#..#..##', '#.*#$O##', '#.*.$O.#', '#.@....#', '#...####', '########'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Scorch Path", map: ['.####....', '.#..#####', '.#$...$.#', '.#.O#O..#', '##.###.##', '#.$O#O.#.', '#.@...$#.', '#####..#.', '....####.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Ash Crossing", map: ['########.', '#......#.', '#.$O#OO##', '##$O$$@.#', '#.$O#...#', '#...#####', '#####....'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Smelt Puzzle", map: ['#######.#####', '#...OO###...#', '#..##O#.....#', '#.@##$#.$..##', '#......$.###.', '#..#..#..#...', '#######..#...', '......####...'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Furnace Trial", map: ['####....', '#..####.', '#OOO..#.', '#O##..##', '#..$.$.#', '###$.$.#', '..#@...#', '..######'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Molten Test", map: ['.####..', '.#..###', '.#.*..#', '.#.*#@#', '##.*..#', '#..O$##', '#....#.', '######.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Flare Lock", map: ['########', '#....@.#', '#.$..$.#', '##.##.##', '#.$#.$#.', '#..OO.#.', '##.OO.#.', '.######.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Spark Riddle", map: ['####....', '#.@####.', '#.....##', '#.O#O..#', '##$$$$.#', '#.O.O###', '#....#..', '######..'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Coal Maze", map: ['...####.', '.###@.#.', '.#....##', '##$#OO.#', '#..$.#.#', '#.#.$..#', '#.OO#$##', '##....#.', '.#..###.', '.####...'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Heat Keep", map: ['######...', '#...###..', '#...####.', '##.$.*.##', '##$#OOO.#', '#.$...@.#', '#...##..#', '#########'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Char Room", map: ['########.', '#...O..#.', '#.$.#..##', '#.**.**.#', '##..#.$.#', '.#..O.@.#', '.########'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Brand Cell", map: ['....####...', '.####..##..', '.#..#.*.##.', '##O$#..*.##', '#...@.*.*.#', '#...#..*..#', '######....#', '....###..##', '......####.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Sear Quarter", map: ['....#####', '...##...#', '...#..@.#', '####.#.##', '#O.O..O.#', '#..###..#', '##.$.$.##', '.#..$.##.', '.###..#..', '...####..'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Torch Alcove", map: ['#####...', '#...##..', '#.#..#..', '#.#$O###', '#..O$..#', '#.#$O#.#', '#.#O$#.#', '#..$O.@#', '###O$#.#', '..#..#.#', '..##...#', '...#####'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4 },
    { name: "Seal the Sanctum", map: ['..#####......', '..#...#......', '..#O#.#######', '..#.$.......#', '..#O#.###.#.#', '.##..#...$$.#', '.##O#.#...###', '##......###..', '#..@.####....', '#...##.......', '#####........'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 4, isBreachSeal: true },

    // ===== LOCATION 5: The Final Breach (81-100) =====
    { name: "Void Chamber", map: ['...#####', '####@..#', '#..$*O.#', '#.....##', '#..#####', '####....'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Abyss Passage", map: ['......#####', '...####...#', '####..$*O.#', '#..$*O...##', '#.@...#####', '#..####....', '####.......'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Rift Hall", map: ['..######', '..#.@..#', '###$O..#', '#.O.$###', '#.#$O.#.', '#.#.#.#.', '#.....#.', '##...##.', '.#####..'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Null Vault", map: ['.########..', '##..#..###.', '##O$#..*.##', '#...@.*.*.#', '#...##....#', '######...##', '.....#####.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "End Gate", map: ['..#####...', '.##..#####', '.##......#', '.#.O**$..#', '##.#..#@##', '#..$**O.#.', '#......##.', '#####..##.', '...#####..'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Omega Ward", map: ['.#####..', '###..##.', '#..$..##', '#@#$#.##', '#.O$O.O#', '###....#', '.##..###', '..#####.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Final Path", map: ['.#####..', '###..#..', '##.*.###', '#..$..##', '#@#$#.##', '#.O$O.O#', '###....#', '..#..###', '..#####.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Last Crossing", map: ['.#######.', '.#..O..#.', '.#..$#.#.', '###**@.##', '.#..$#.#.', '.#..O..#.', '.#######.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Doom Puzzle", map: ['......#....', '##########.', '###...#..#.', '#.@OO*O$.#.', '#.$.$.#..#.', '#####.#.###', '....#.#..#.', '....#....#.', '....###..#.', '....######.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Dusk Trial", map: ['..####..####', '###..####..#', '#..$...O.O.#', '#.$.$...#..#', '###.####.O.#', '##.@.....###', '##...#######', '.#####......'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Fade Test", map: ['#######', '###...#', '##O$O.#', '#.$O$##', '#.O$O.#', '#.$O$.#', '##...@#', '#######', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Wane Lock", map: ['#######', '##....#', '##O$O.#', '#.$O$.#', '#.O$O##', '#.$O$.#', '##...@#', '###..##', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Brink Riddle", map: ['#######', '##....#', '##O$O.#', '#.$O$##', '#.O$O##', '#.$O$.#', '##...@#', '####..#', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Edge Maze", map: ['#######', '###...#', '##O$O.#', '#.$O$##', '#.O$O##', '#.$O$.#', '##...@#', '##..###', '#######'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Apex Keep", map: ['.....####...', '.#####..#...', '.#..$...##..', '.#..#.#$##..', '.##O.O.O#...', '..#$#.#$####', '###O.O.O...#', '###$#.#.@..#', '..#...$..###', '..#..#####..', '..####......'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Peak Room", map: ['.#########.', '##..#..####', '##O$#..*..#', '#...@.*.*.#', '#...#..*..#', '######*.###', '....##...##', '....##...##', '.....#####.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Rend Cell", map: ['########', '#..#...#', '#.$$*O.#', '#.O..O.#', '#.O*$$@#', '#...#..#', '########'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Sever Quarter", map: ['.......####...', '######.#..#...', '#....###$.##..', '##.@.OOO.$.##.', '.##.$###....##', '..#..#.#.....#', '..####.#######'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Break Alcove", map: ['.#######.', '.#..####.', '.#...$.#.', '##$#O#O#.', '#..#@#.##', '#.$#O#O.#', '#....$..#', '####.#..#', '.###...##', '.#######.'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5 },
    { name: "Seal the Final Breach", map: ['...####.......', '...#..#.......', '...#..#.......', '...#..########', '#####$@$.$.$.#', '#....**OOOO..#', '#...##.#######', '#####...##....', '....#....#....', '....##...#....', '.....##..#....', '......####....'], charges: { tether: 3, transpose: 3, ghostwalk: 3 }, location: 5, isBreachSeal: true }
  ];

  function parse(levelId) {
    var idx = levelId - 1;
    if (idx < 0 || idx >= LEVEL_DATA.length) return null;

    var data = LEVEL_DATA[idx];
    var map = data.map;
    var walls = {};
    var targets = {};
    var stones = {};
    var player = null;
    var height = map.length;
    var width = 0;

    for (var y = 0; y < height; y++) {
      var row = map[y];
      if (row.length > width) width = row.length;
      for (var x = 0; x < row.length; x++) {
        var ch = row[x];
        var key = x + ',' + y;
        switch (ch) {
          case '#': walls[key] = true; break;
          case 'O': targets[key] = true; break;
          case '@': player = { x: x, y: y }; break;
          case '$': stones[key] = true; break;
          case '*': stones[key] = true; targets[key] = true; break;
          case '+': player = { x: x, y: y }; targets[key] = true; break;
        }
      }
    }

    // Flood-fill from player to find all inside tiles
    var inside = {};
    if (player) {
      var queue = [player.x + ',' + player.y];
      inside[player.x + ',' + player.y] = true;
      while (queue.length > 0) {
        var cur = queue.shift();
        var cp = cur.split(',');
        var cx = parseInt(cp[0]);
        var cy = parseInt(cp[1]);
        var dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        for (var d = 0; d < dirs.length; d++) {
          var nx = cx + dirs[d][0];
          var ny = cy + dirs[d][1];
          var nk = nx + ',' + ny;
          if (!inside[nk] && !walls[nk] && nx >= 0 && ny >= 0 && nx < width && ny < height) {
            inside[nk] = true;
            queue.push(nk);
          }
        }
      }
    }
    for (var wk in walls) { inside[wk] = true; }

    return {
      id: levelId,
      name: data.name,
      width: width,
      height: height,
      walls: walls,
      inside: inside,
      targets: targets,
      stones: stones,
      player: player,
      charges: {
        tether: data.charges.tether,
        transpose: data.charges.transpose,
        ghostwalk: data.charges.ghostwalk
      },
      location: data.location,
      isTutorial: !!data.isTutorial,
      isBreachSeal: !!data.isBreachSeal
    };
  }

  var Levels = {
    parse: parse,

    getCount: function () {
      return LEVEL_DATA.length;
    },

    getMeta: function (levelId) {
      var idx = levelId - 1;
      if (idx < 0 || idx >= LEVEL_DATA.length) return null;
      var d = LEVEL_DATA[idx];
      return {
        id: levelId,
        name: d.name,
        charges: { tether: d.charges.tether, transpose: d.charges.transpose, ghostwalk: d.charges.ghostwalk },
        location: d.location,
        isTutorial: !!d.isTutorial,
        isBreachSeal: !!d.isBreachSeal
      };
    },

    getLocation: function (levelId) {
      var idx = levelId - 1;
      if (idx < 0 || idx >= LEVEL_DATA.length) return 1;
      return LEVEL_DATA[idx].location;
    },

    getLocationMeta: function (locationId) {
      for (var i = 0; i < LOCATIONS.length; i++) {
        if (LOCATIONS[i].id === locationId) return LOCATIONS[i];
      }
      return LOCATIONS[0];
    },

    getLocationLevels: function (locationId) {
      var meta = Levels.getLocationMeta(locationId);
      var ids = [];
      for (var i = meta.startLevel; i <= meta.endLevel; i++) ids.push(i);
      return ids;
    },

    getBreachSealGate: function () {
      return BREACH_SEAL_GATE;
    },

    validate: function () {
      var issues = [];
      for (var i = 0; i < LEVEL_DATA.length; i++) {
        var level = parse(i + 1);
        if (!level.player) {
          issues.push('Level ' + (i + 1) + ': no player');
        }
        var stoneCount = Object.keys(level.stones).length;
        var targetCount = Object.keys(level.targets).length;
        if (stoneCount !== targetCount) {
          issues.push('Level ' + (i + 1) + ': ' + stoneCount + ' stones vs ' + targetCount + ' sigils');
        }
      }
      return issues;
    }
  };

  window.Levels = Levels;
})();
