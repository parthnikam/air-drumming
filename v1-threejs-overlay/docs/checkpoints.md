# Project Checkpoints

Running log of intentional milestones for `v1-threejs-overlay`.

---

## CP-0 — Project framing (historical)

- Goal: AR-style webcam + MediaPipe + Three.js overlay.
- v0: Python MediaPipe demos (body/hand).
- v1: Browser is the main path for rendering.

---

## CP-1 — Hand overlay + static 3D kit

**Date:** 2026-07-19

- Webcam + MediaPipe Tasks hand landmarker (2 hands).
- Three.js orthographic overlay with landmark joints/lines.
- 3D cylinder drums (not flat discs) + side cymbals.
- Kit scaled larger for playability.
- **No** hit detection or sound yet.

---

## CP-2 — Part-aware collision + sample playback

**Date:** 2026-07-19

### Decisions (locked)

1. **Parts (minimal):** drums = `head | rim | shell`; cymbals = `bell | edge`.
2. **Striker:** index fingertip only (MediaPipe landmark **8**).
3. **Dynamics:** hit amplitude from strike **velocity** (not binary on/off only).
4. **Audio source:** files under `public/Samples/*.wav` (name describes the sound).

### Collision design

- No physics engine.
- Each instrument is a `THREE.Group` with known local `radius` / `depth`.
- World index-tip → instrument local frame via inverted `matrixWorld`.
- **Drum zones** (local Z along barrel; +Z = playing head):
  - `rim` — front band, outer radial ring
  - `head` — front band, inner disc
  - `shell` — mid barrel, outer wall band
- **Cymbal zones:**
  - `bell` — inner radius
  - `edge` — outer disc (bow folded into edge for minimal parts)
- Hit rules: **enter** zone (or change part) + speed above threshold + per-instrument cooldown.
- Intensity: remapped from speed (`MIN_SPEED` → `REF_SPEED`) → gain curve in `drumPlayer`.

### Instrument roles from placement

Screen left → right (mirrored selfie view):

| Id | Role | Why |
|----|------|-----|
| `cym_l` | Left cymbal | Crash/hi-hat side of kit |
| `floor_tom` | Large left drum | Larger left drum → low tom |
| `rack_tom` | Inner left | Smaller rack tom |
| `snare` | Inner right | Classic snare seat |
| `kick` | Largest right | Biggest shell → bass drum |
| `cym_r` | Right cymbal | Ride/crash side |

### Sample map (filename → role)

Chosen from names in `public/Samples/` only:

| Instrument | head / edge | rim / bell | shell |
|------------|-------------|------------|-------|
| `floor_tom` | `tom-acoustic02.wav` | `perc-metal.wav` | `perc-hollow.wav` |
| `rack_tom` | `tom-acoustic01.wav` | `perc-short.wav` | `tom-short.wav` |
| `snare` | `snare-acoustic01.wav` | `snare-block.wav` | `snare-noise.wav` |
| `kick` | `kick-acoustic01.wav` | `kick-tight.wav` | `kick-stomp.wav` |
| `cym_l` | edge: `crash-acoustic.wav` | bell: `hihat-ring.wav` | — |
| `cym_r` | edge: `crash-tape.wav` | bell: `ride-acoustic01.wav` | — |

Rationale in short:

- **Acoustic** variants preferred for heads (natural kit body).
- **Snare rim** → `snare-block` (rim/click character in the name).
- **Shell** → hollow/noise/stomp/short textures, not full body samples.
- **Cymbal edge** → crash family; **bell** → ring/ride ping family.

### New / updated source files

- `src/audio/soundMap.ts` — ids + sample paths
- `src/audio/drumPlayer.ts` — decode + polyphonic oneshots
- `src/collision/zones.ts` — part classification
- `src/collision/hitDetector.ts` — velocity enter hits
- `src/render/drumKit.ts` — exports instruments + flash
- `src/render/overlay.ts` — wires detector + player
- `src/main.ts` — preload samples, unlock AudioContext

### How to verify

1. `bun run dev -- --host 127.0.0.1 --port 5173`
2. Click once (audio unlock).
3. Move index finger quickly into a drum head / rim / shell or cymbal edge / bell.
4. Expect: matching sample, louder on faster strikes, brief emissive flash.
5. `bun run build` must pass.

### Still deferred

- Multi-finger / stick mesh
- Head center vs edge split
- Smoothing / Kalman on landmarks
- Physics engine
- Visual debug wireframe zones (optional next)

---

## CP-3 — Distinct cymbal roles + 3-zone plates

**Date:** 2026-07-19

### Problem

Both side plates were treated like interchangeable crashes (`cym_l` / `cym_r`) with only `bell | edge`. On a real kit they are different instruments, and a single plate has multiple playable regions.

### Decisions

1. **Left = `hi_hat`**, **right = `ride`** (ids renamed from `cym_l` / `cym_r`).
2. Cymbal parts expanded to **`bell | bow | edge`** (radial zones).
3. Samples chosen by name family so functions never collide:

| Id | Role | bell | bow | edge |
|----|------|------|-----|------|
| `hi_hat` | Hi-hat | `hihat-ring.wav` | `hihat-acoustic01.wav` | `openhat-acoustic01.wav` |
| `ride` | Ride + crash edge | `ride-acoustic02.wav` | `ride-acoustic01.wav` | `crash-acoustic.wav` |

Zone radii (fraction of outer `R`):

- `bell` ≤ 0.28R  
- `bow` ≤ 0.68R  
- `edge` ≤ 1.1R  

### Visual cues

- Hi-hat: smaller, dual-disc silhouette, darker bronze, slightly flatter tilt.
- Ride: larger single plate, brighter brass, more tilt, stronger bell.

### Code touchpoints

- `src/audio/soundMap.ts` — roles + 3-part maps
- `src/collision/zones.ts` — `classifyCymbal` bow band
- `src/render/drumKit.ts` — distinct geometry/materials per role
- `docs/summary.md` — layout table

### Verify

Strike each cymbal center → mid → outer rim; left should read closed/open hat, right should read ride ping/body vs crash edge.

---

## CP-4 — Drum sample map refined (head / rim / shell)

**Date:** 2026-07-19

### Goal

Same treatment as cymbals: each drum is a **distinct kit voice**, and each **part** uses a sample whose **filename** matches that playing technique — pulled only from `public/Samples/`.

### Final drum map

| Instrument | Placement | head (main face) | rim | shell |
|------------|-----------|------------------|-----|-------|
| `floor_tom` | Large left | `tom-acoustic02.wav` (deeper tom) | `perc-metal.wav` (metal rim) | `perc-hollow.wav` (hollow shell) |
| `rack_tom` | Inner left | `tom-rototom.wav` (higher/tighter) | `perc-short.wav` (short rim tick) | `tom-short.wav` (quick body) |
| `snare` | Inner right | `snare-acoustic01.wav` | `snare-block.wav` (rim block) | `snare-noise.wav` (shell/wires) |
| `kick` | Largest right | `kick-acoustic01.wav` | `kick-tight.wav` (hoop click) | `kick-stomp.wav` (body stomp) |

### Selection rules used

1. **Head** stays in the instrument family (`kick-*`, `snare-*`, `tom-*`).
2. **Rim** prefers click/tight/block/metal names over full body hits.
3. **Shell** prefers hollow / noise / stomp / short — not a second full head sample.
4. **Toms split by pitch cue:** rototom + short (rack/high) vs acoustic02 + hollow (floor/low).
5. No two drums share the same sample path.

### Code

- Updated `src/audio/soundMap.ts` (comments document each pick).
- `docs/summary.md` table synced.

### Verify

Strike head, rim, and shell on each of the four drums; each of the 12 hits should sound different and read as kick / snare / high tom / low tom.

---

## Next candidates

- Tunable thresholds UI (min speed, zone radii).
- Debug overlay for active part under fingertip.
- Optional closed/open hi-hat gesture (pinch) later.
