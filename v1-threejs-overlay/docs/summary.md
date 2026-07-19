# Project Summary

Last updated: July 19, 2026

## Goal

Build toward an AR-style interaction prototype where webcam input is tracked with MediaPipe and visual objects are rendered smoothly with Three.js over the live video feed. Hands strike a virtual drum kit; hits are part-aware and play samples from `public/Samples`.

## v0-python-mediapipe

This folder contains the first Python/OpenCV MediaPipe demos.

Files:

- `body_capture.py`: Opens webcam input, runs `tasks/body_pose_landmarker.task`, and draws body pose landmarks on the video feed.
- `hand_capture.py`: Opens webcam input, runs `tasks/hand_landmarker.task`, and draws hand landmarks on the video feed.
- `requirements.txt`: Python dependencies for the demo scripts.
- `tasks/body_pose_landmarker.task`: Local MediaPipe pose model.
- `tasks/hand_landmarker.task`: Local MediaPipe hand model.

Important choice:

- We removed legacy `mp.solutions` drawing and used the newer MediaPipe Tasks API through `mediapipe.tasks.python.vision`.

Run examples:

```powershell
C:\Users\108pa\miniconda3\envs\py3.10\python.exe body_capture.py
C:\Users\108pa\miniconda3\envs\py3.10\python.exe hand_capture.py
```

## v1-threejs-overlay

This folder is the browser-based AR overlay prototype.

Stack:

- Vite
- TypeScript
- Three.js
- `@mediapipe/tasks-vision`
- Web Audio API (sample playback)

Current behavior:

- Opens the webcam in the browser.
- Loads `public/tasks/hand_landmarker.task`.
- Tracks up to two hands with MediaPipe Tasks Vision.
- Draws hand landmark points and connection lines in Three.js over the video feed.
- Index fingertips are highlighted (striker).
- Renders a 3D drum kit (4 drums + 2 cymbals) as volumetric cylinders.
- Detects index-finger strikes on instrument parts with velocity-based amplitude.
- Plays mapped `.wav` samples from `public/Samples/`.

### Kit layout (screen space, mirrored video)

Left → right:

| Visual | Role id | Function |
|--------|---------|----------|
| Left cymbal | `hi_hat` | Hi-hat (timekeeping / open edge) |
| Large left drum | `floor_tom` | Low tom |
| Inner left drum | `rack_tom` | Higher tom |
| Inner right drum | `snare` | Snare |
| Largest right drum | `kick` | Bass drum |
| Right cymbal | `ride` | Ride body + crash on edge |

### Hit parts

- **Drums:** `head` · `rim` · `shell`
- **Cymbals:** `bell` · `bow` · `edge` (three radial zones)

### Sound map (by instrument + part)

| Id | head / bow | rim / bell | shell / edge |
|----|------------|------------|--------------|
| `kick` | `kick-acoustic01` | `kick-tight` | `kick-stomp` |
| `snare` | `snare-acoustic01` | `snare-block` | `snare-noise` |
| `rack_tom` | `tom-rototom` | `perc-short` | `tom-short` |
| `floor_tom` | `tom-acoustic02` | `perc-metal` | `perc-hollow` |
| `hi_hat` | bow: `hihat-acoustic01` | bell: `hihat-ring` | edge: `openhat-acoustic01` |
| `ride` | bow: `ride-acoustic01` | bell: `ride-acoustic02` | edge: `crash-acoustic` |

Full rationale: `src/audio/soundMap.ts` and `docs/checkpoints.md` (CP-2–CP-4).

Main files:

- `src/main.ts`: App startup, audio unlock, frame loop.
- `src/input/camera.ts`: Webcam setup.
- `src/tracking/tracker.ts`: MediaPipe hand landmarker setup.
- `src/tracking/hand.ts`: Hand constants and landmark connections.
- `src/render/overlay.ts`: Three.js scene, hands, hit loop, flash.
- `src/render/drumKit.ts`: Drum/cymbal geometry + instrument metadata.
- `src/collision/zones.ts`: Local-space part classification.
- `src/collision/hitDetector.ts`: Index tip velocity + enter + cooldown.
- `src/audio/soundMap.ts`: Instrument/part → sample paths.
- `src/audio/drumPlayer.ts`: Web Audio preload + polyphonic playback.
- `src/style.css`: Full-screen video and canvas overlay styling.
- `public/Samples/`: Drum kit `.wav` one-shots.

Run:

```powershell
cd v1-threejs-overlay
bun run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

Click or press a key once so the browser allows audio. Strike drums with an **index finger**.

Build check:

```powershell
bun run build
```

## Removed Experiments

We previously tried rendering short sticks when thumb and index finger pinched together:

- one stick for a pinch gesture
- then two sticks, one per hand
- red and blue colors to distinguish hands
- base of each stick aligned to the thumb/index contact point

That code was removed when the prototype shifted to drum overlays.

## Current Architecture

```text
webcam video
  -> MediaPipe hand tracking (index tip = striker)
  -> Three.js hand overlay
  -> local-space drum/cymbal zone tests
  -> velocity enter hits
  -> Web Audio samples (/Samples)
  -> emissive flash on instrument
```

Python remains useful for quick MediaPipe model tests; interaction and rendering live in the browser.

## Skipped For Now

- React or another UI framework
- Python-to-browser bridge
- WebSockets
- Full physics engine
- Gesture state machine
- Smoothing filters / persistent hand identity
- Multi-finger strikers
- Head center vs edge split (kept single `head`)

## Checkpoints

Progress history lives in `docs/checkpoints.md`.
