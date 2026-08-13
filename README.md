# BLADE:13 — PRISM BREAK

**An 8-bit cyberpunk survivors-like in 13 kilobytes.**
UNICORN, the city's rainbow-energy AI, has corrupted every machine into a prism beast. Sever the network with three monomolecular blades, collect seven-color shards, and trigger PRISM BREAK before the BLACK UNICORN ends your run.

> js13kGames 2026 entry — Theme: Unicorns and Rainbows — Desktop + Mobile

**Play:** TODO (link)
**Source:** this repository

---

## Controls

**Desktop**
| Key | Action |
|---|---|
| `WASD` / arrows | Move |
| `SPACE` | Blink (chain-strike up to N nearby foes) |
| `F` / `Shift` | PRISM BREAK (only when charged) |
| `1` `2` `3` | Pick a level-up card |
| `M` | Mute |

**Mobile — one thumb does everything**
- **Drag anywhere** — a virtual stick appears under your thumb; drag to move.
- **Tap** (no drag) — Blink.
- The **PRISM BREAK** button only appears when it is charged.
- Portrait is auto-detected: the canvas, the pixel buffer and the card layout all re-flow.

---

## What is in there

- **Three-sword sweep.** You attack automatically. Positioning is the whole game.
- **Blink with charges.** Two charges, each recharging over time; kills speed the recharge but a hard lockout means you can never spam it. Landing costs you a beat of attack recovery — blink is a decision, not a button.
- **PRISM BREAK.** Kills fill the meter, but it does *not* fire on its own. You choose the moment. Its mechanics are unchanged: while it runs, the screen tears into magenta/cyan chroma split and every kill extends it.
- **19 cards, three kinds.** `PROGRAM` (blue) and `CHROME` (amber) are clean upgrades; `OVERLOAD` (red) always costs you something — +55% damage for −30% max HP, +50% attack speed for −25% reach. A few cards only appear once you have committed to a line. You will only ever see about a third of the pool in one run.
- **Seven enemy families.** Crawlers, dashers, brutes, hexers, splitters (die into two), bombers (detonate, and your blink can set them off deliberately), and hives that keep spawning until you go and kill them. Elites wear a magenta pulse; bosses telegraph a ground slam.
- **Threat tiers.** Every 28 seconds the threat level rises and a wave rolls in from one direction. Enemy speed keeps climbing until, late on, running is no longer an option.
- **A city that generates itself.** Streets, rooftops, neon and retracting spike traps all come out of one coordinate hash — no stored map, infinite in every direction.

## Under the hood

Everything is drawn with Canvas 2D path commands. There are no images, no audio files, no external requests.

- **Pixel pipeline.** The world renders into a 320×200 offscreen buffer, then blits up 3× with smoothing off — real chunky pixels, NES-sampled palette. The UI is drawn at full resolution on top so text stays legible.
- **Psychedelia tied to play.** Trail feedback, scanline warping and hue drift all scale with your kill streak and PRISM BREAK, so the world literally destabilises as you snowball.
- **Audio is synthesised at runtime.** A small engine layers filtered-noise percussion over oscillators, through a generated convolution reverb, with stereo panning on hits and a ducking low-pass when you are struck. The soundtrack is a pentatonic look-ahead sequencer whose intensity rises with time.
- **Adaptive quality.** Smoothed frame time drives a hysteresis switch that drops warp bands and the chroma split on weaker devices.

## Build

```bash
npm ci               # exact terser + roadroller versions from package-lock.json
python3 build.py     # src/*.js -> minify -> pack -> zip
```

`build.py` concatenates `src/*.js` in filename order, refuses to build if any external-request API appears in the source, minifies with terser, packs with Roadroller, and reports the zip size against the 13,312-byte hard limit. The themed release target is at most 13,100 bytes.
Roadroller parameters and zip metadata are fixed, so identical source produces an identical submission archive.

Output lands in `build/`:
- `BLADE13-dev.html` — readable single file, for debugging
- `dist/index.html` + `BLADE13.zip` — the submission package

## Tests

```bash
sh tools/qa.sh
npm run verify       # full release probes + reproducible-build check
```

Three layers, all headless:

| Layer | What it covers |
|---|---|
| `bot-test.mjs` | Simulation core — determinism, five-minute autoplay, value ranges, card-pool limits |
| `render-smoke.mjs` | Every render path against a proxied Canvas stub, across all four game states plus input |
| `packed-smoke.mjs` | The **Roadroller-packed build** actually runs — catches the classic "fine in dev, broken after packing" failure |
| `runner-test.mjs` | Dasher charge/burst timers stay finite and the burst actually occurs |
| `release-guard.mjs` | Public text contains no blocked third-party names |

Plus focused probes: `cheese.mjs` (bots that deliberately try to exploit sustain, fleeing and camping), `bench.mjs` (a kiting bot used for difficulty tuning), `terrain.mjs`, `pose.mjs`, `port.mjs` (portrait layout), `perf.mjs`, `seed-sweep.mjs` (deterministic seeds, for reproducing intermittent crashes).

## Source layout

| File | Role |
|---|---|
| `src/00-core.js` | Constants, PRNG, coordinate hash, terrain queries, player state |
| `src/10-cards.js` | Card pool, prerequisites, roll logic |
| `src/20-game.js` | Combat, spawning, waves, blink, PRISM BREAK, levelling |
| `src/30-juice.js` | Hitstop, rings, corpse halves, decals, combo, screen feedback |
| `src/40-render.js` | World and UI rendering, HUD, card screen, pixel icons |
| `src/45-art.js` | Character and creature art |
| `src/50-audio.js` | Synth, effect table, procedural soundtrack |
| `src/60-main.js` | Layout, input, pixel-buffer compositing, main loop |

## Credits

Built by Vion / Namek Game Studio for js13kGames 2026.
Art, sound and code are original; no external assets.

## License

MIT
