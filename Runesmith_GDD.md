# Runesmith: Seal the Breach — Game Design Doc (GDD)

**Genre:** Puzzle (Sokoban variant)  
**Theme:** Medieval fantasy / runecraft  
**Scope:** 1-day build (HTML5)  
**Core hook:** Classic Sokoban + 3 simple “wizard utility” spells that change positioning rules.

---

## 1) High concept

You are a **Runesmith** sealing a dimensional breach. Each chamber contains **runestones** and **sigils**.  
Push runestones onto sigils to complete the seal — and later use limited spellcraft to solve increasingly constrained layouts.

**Promise:** Sokoban “aha!” moments, with **three spells** that add novelty without adding heavy systems or art.

---

## 2) Target platform & constraints

- **Platform:** HTML5 browser game (desktop-first; mobile optional later)
- **Input:** keyboard (WASD / arrows + spell keys + undo)
- **Graphics:** minimal tiles (can be simple shapes), with optional polish overlays
- **Delivery:** complete playable 20-level campaign in one day

---

## 3) Core gameplay

### Win condition
A level is complete when **every sigil tile (`O`) is covered by a runestone**.

### Base Sokoban rules
- Movement is 4-directional.
- Walls block.
- Player can **push** a runestone **one tile** if the tile behind it is empty or a sigil.
- No pulling in base rules (pull is a spell).

---

## 4) Spells (twist)

Spells are **per-level limited charges**. Undo reverses spell use (recommended).

### Spell A — Rune Tether (Pull)
**Intent:** reposition a runestone from distance without moving the player.

**Action:** choose a direction → find the **first runestone** in line-of-sight.  
If the tile directly in front of the player is empty/sigil AND all tiles until the stone are empty/sigil, then:

- The runestone moves **one tile toward the player**
- The player does not move
- **Cost:** 1 charge

**Notes:**
- If a stone is adjacent in that direction, tether is blocked (because the adjacent tile is not empty).

**Fantasy names (optional):** Rune Tether / Aether Hook / Sigil Draw

---

### Spell B — Transpose (Swap)
**Intent:** get behind a stone in tight areas, fix corner constraints.

If there’s an **adjacent runestone** in the chosen direction:

- Swap **player ↔ runestone**
- **Cost:** 1 charge

---

### Spell C — Ghostwalk
**Intent:** pass through a stone without moving it (great for chokepoints).

If there’s an adjacent runestone in the chosen direction AND the tile **behind** it is empty/sigil:

- Player moves to the tile behind the stone
- The runestone stays where it is
- **Cost:** 1 charge

---

## 5) Progression & unlocking

Unlock pacing: **1 spell every 3 levels**.

- **Levels 1–3:** no spells (pure Sokoban)
- **Levels 4–6:** unlock **Rune Tether**
- **Levels 7–9:** unlock **Transpose** (Tether remains)
- **Levels 10–20:** unlock **Ghostwalk** (all spells available)

**Teaching tip:** some levels after unlock can set a spell’s charges to `0` to focus learning.

---

## 6) Controls (suggested)

- Move: **WASD / Arrow keys**
- Undo: **Z**
- Restart: **R**
- Rune Tether: **1** (uses “facing” direction = last move direction; if none, keep last facing)
- Transpose: **2**
- Ghostwalk: **3**

Optional: show a small “facing arrow” marker on the player tile for clarity.

---

## 7) UI / UX (minimal but solid)

### In-level HUD
- Level number + name
- Moves
- Optional: time
- Spell charges: **Tether / Transpose / Ghostwalk**

### End-of-level
- “Seal Complete”
- Moves, spells used, time
- Stars (optional)

### Quality-of-life
- Undo supports both movement and spells
- Restart level
- Level select (or Prev/Next)

---

## 8) Difficulty tracking

You’ll want **two layers**: a designer difficulty rating and a player-performance rating.

### A) Designer Difficulty Index (DI 1–10)
Store DI in level metadata (first-pass estimate). Use a simple heuristic:

- `base = stones * 2`
- `+1` if chokepoints (1-tile corridors) exist
- `+1` if any sigils sit inside chokepoints
- `+1` per spell type intended/available (0–3)
- `+ areaBucket` where small=0, medium=1, large=2

Then: `DI = clamp(round(base/2 + modifiers), 1, 10)`

This is fast and consistent enough for pacing. After playtesting, tune DI manually.

### B) Stars (player performance)
Per level, store:
- `parMoves`
- `parSpellsUsed`

Award:
- **3★** if moves ≤ parMoves AND spellsUsed ≤ parSpellsUsed
- **2★** if moves ≤ parMoves × 1.25
- **1★** otherwise

---

## 9) Tech stack & repo fit

This project is built on the **`mesa_LightsOut`** template repo structure:
- `index.html`
- `css/`
- `js/`
- `sdk/` (Mesa integration)
- `dev.bat` (local dev helper)
- `generate-levels.js` (utility script)

The existing template is **vanilla HTML/CSS/JavaScript**, which is ideal for a 1‑day Sokoban build.

> You’ll mainly replace the LightsOut game logic in `js/` with the Runesmith grid engine + renderer, while keeping the Mesa wrapper/hooks intact.

---

## 10) Minimal assets needed

You can ship with simple colored rectangles/circles, but here’s the “nice enough” list:

### Tiles (static)
- **Wall** tile
- **Floor** tile (subtle texture)
- **Sigil** tile (glowing circle/mark)

### Entities (sprites)
- **Player** (one sprite, optional 4-direction variants)
- **Runestone** (crate/stone)

### FX (optional polish)
- Sigil glow pulse (alpha)
- Small particle burst on completion
- Soft shadow under stones/player

### UI
- 3 small spell icons (Tether, Swap, Ghostwalk)
- Optional medieval frame panel for HUD

### Audio (optional but high-impact)
- Step
- Push
- Spell cast
- Seal complete

---

## 11) Data representation

### ASCII map format
Use a list of strings (rows) and parse into sets.

Legend:
- `#` = wall
- `.` = floor
- `O` = sigil (target)
- `@` = player
- `$` = runestone
- `*` = runestone on sigil (stone + target)

### Suggested in-memory state
- `walls: Set<cellKey>`
- `targets: Set<cellKey>`
- `stones: Set<cellKey>`
- `player: {x, y}`
- `charges: { tether, transpose, ghostwalk }`
- `moves: number`
- `facing: {dx, dy}` (last move direction)

### Undo stack
Push a snapshot each action:
- player
- stones (copy)
- charges
- moves
- facing

---

## 12) Implementation plan (1 day)

1. **Parse levels** (ASCII → state)
2. **Render grid** (Canvas or DOM grid)
3. **Movement & pushing**
4. **Win detection**
5. **Undo + restart**
6. **Spells**
7. **Level select / next**
8. **Polish** (HUD, small animations, SFX)

---

# 13) Level pack (20 levels)

**Legend:** `# . @ $ O *`

**Unlock rule recap:**  
1–3 none • 4–6 Tether • 7–9 +Transpose • 10–20 +Ghostwalk

> NOTE: These are first-pass layouts. You should do one playtest pass and adjust **par moves** and possibly a few layouts if any are too easy/hard.

---

## Level metadata (overview)

| # | Name | Charges | DI | Par (moves / spells) |
|---:|---|---|---:|---:|
| 1 | Training Yard | — | 1 | 8 / 0 |
| 2 | Two Sigils | — | 2 | 18 / 0 |
| 3 | Narrow Hall | — | 3 | 28 / 0 |
| 4 | Tether Lesson | Tether(3) | 3 | 18 / 1 |
| 5 | Twin Tethers | Tether(4) | 4 | 28 / 2 |
| 6 | Sightline | Tether(3) | 5 | 40 / 2 |
| 7 | First Transpose | Transpose(2) | 4 | 16 / 1 |
| 8 | Split Practice | Tether(1), Transpose(2) | 5 | 44 / 2 |
| 9 | Two Techniques | Tether(1), Transpose(2) | 6 | 50 / 3 |
| 10 | Ghostwalk Gate | Ghostwalk(2) | 5 | 34 / 2 |
| 11 | Sealed Choke | Ghostwalk(3) | 6 | 54 / 3 |
| 12 | Mixed Arts | Tether(2), Transpose(2), Ghostwalk(2) | 6 | 60 / 4 |
| 13 | The Forked Hall | Tether(2), Transpose(2), Ghostwalk(2) | 6 | 64 / 4 |
| 14 | Sigil Gallery | Tether(2), Transpose(2), Ghostwalk(2) | 7 | 72 / 5 |
| 15 | Mason’s Trap | Tether(2), Transpose(2), Ghostwalk(2) | 7 | 80 / 5 |
| 16 | Twin Chokepoints | Tether(2), Transpose(2), Ghostwalk(3) | 8 | 92 / 6 |
| 17 | Runic Switchback | Tether(2), Transpose(3), Ghostwalk(3) | 8 | 100 / 7 |
| 18 | Breach Chamber | Tether(3), Transpose(3), Ghostwalk(3) | 9 | 120 / 8 |
| 19 | Masterwork | Tether(3), Transpose(3), Ghostwalk(3) | 9 | 130 / 9 |
| 20 | Seal the Breach | Tether(3), Transpose(4), Ghostwalk(4) | 10 | 150 / 10 |

---

## Levels (ASCII)

### 1) Training Yard
```txt
#######
#.....#
#.@$O.#
#.....#
#######
```

### 2) Two Sigils
```txt
########
#......#
#.@$O..#
#..$O..#
#......#
########
```

### 3) Narrow Hall
```txt
#########
#.......#
#..###..#
#.@$O...#
#..#....#
#..$O...#
#########
```

### 4) Tether Lesson
```txt
#########
#@......#
###.#####
#..O$#..#
#.......#
#########
```

### 5) Twin Tethers
```txt
############
#@.........#
###.########
#..O$#..O$##
#.....#....#
############
```

### 6) Sightline
```txt
###########
#@........#
#..###..O.#
#..O$#..$.#
#....#....#
###########
```

### 7) First Transpose
```txt
########
#......#
#####..#
#O@$#..#
#......#
########
```

### 8) Split Practice
```txt
############
#..........#
#..O@$#....#
#####.#.####
#....#..O..#
#....#..$..#
#..........#
############
```

### 9) Two Techniques
```txt
############
#@.........#
###.########
#..O$#.....#
#.....#O.$##
#..........#
############
```

### 10) Ghostwalk Gate
```txt
##########
#@*....#.#
###.####.#
#..$..O..#
#........#
##########
```

### 11) Sealed Choke
```txt
###########
#@*...#...#
###.###.#.#
#..$..O.#.#
#.....#O$.#
#.........#
###########
```

### 12) Mixed Arts
```txt
############
#@*....#...#
###.###.#.##
#..$....#O.#
#..###O.#$.#
#......O...#
############
```

### 13) The Forked Hall
```txt
###########
#@....#...#
#..$..#O..#
#..#..#...#
#..#.$O$..#
#..#..#...#
#..O..#...#
###########
```

### 14) Sigil Gallery
```txt
############
#@.....#...#
#.$###.#.O.#
#..O..#.$..#
####..#....#
#..$..O....#
#..........#
############
```

### 15) Mason’s Trap
```txt
#############
#@....#.....#
#.$O..#..O$.#
#..#..#..#..#
#..#..$..#..#
#..O.....O..#
#############
```

### 16) Twin Chokepoints
```txt
############
#@*...#....#
###.###.####
#..$..O....#
#..#..###..#
#..O..$..$O#
#..........#
############
```

### 17) Runic Switchback
```txt
#############
#@.....#....#
#..###.#.O..#
#..$...#.$..#
#..#.###.#..#
#..O...$..O.#
#.....#O.$..#
#############
```

### 18) Breach Chamber
```txt
##############
#@.....#.....#
#..###.#.O.O.#
#..$...#.$...#
#..#.###.#...#
#..O...$..O..#
#..$..#O.$...#
#.....#......#
##############
```

### 19) Masterwork
```txt
##############
#@.....#.....#
#..###.#.O...#
#..$..O#.$...#
#..#.###.#O..#
#..O...$..O..#
#..$..#..$...#
#.....#......#
##############
```

### 20) Seal the Breach
```txt
###############
#@.....#......#
#..###.#.O.O..#
#..$..O#.$....#
#..#.###.#O...#
#..O...$..#...#
#..$..#..$..$O#
#.....#.......#
###############
```

---

## 14) Optional extensions (if you finish early)

- **Ranked clears:** Gold/Silver/Bronze by move count
- **Sigil “locking”:** a stone on a sigil can’t be moved (optional hard mode)
- **Daily seed level:** random small puzzle generator (very optional)
- **Accessibility:** remappable keys; colorblind-friendly sigil outline

---

## 15) Risks & mitigations (quick)

- **Softlocks:** encourage Undo; optionally add “detect obvious dead corner” warnings later.
- **Difficulty curve:** use DI + a quick playtest to tune 2–3 mid levels.
- **Spell confusion:** show tooltips on first unlock + animated arrow for Tether/Ghostwalk.

---

*End of document.*
