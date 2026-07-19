# Project Summary

Last updated: July 19, 2026

## Goal

Build toward an AR-style interaction prototype where webcam input is tracked with MediaPipe and visual objects are rendered smoothly with Three.js over the live video feed.

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

Current behavior:

- Opens the webcam in the browser.
- Loads `public/tasks/hand_landmarker.task`.
- Tracks up to two hands with MediaPipe Tasks Vision.
- Draws hand landmark points and connection lines in Three.js over the video feed.
- Renders a 3D drum kit overlay in front of the user.
- The drum kit has four main drums of varying sizes and two cymbals, one on each side.
- Drums and cymbals are 3D cylinder-based objects whose faces are orthogonal to the front display.

Main files:

- `src/main.ts`: App startup and frame loop.
- `src/input/camera.ts`: Webcam setup.
- `src/tracking/tracker.ts`: MediaPipe hand landmarker setup.
- `src/tracking/hand.ts`: Hand constants and landmark connections.
- `src/render/overlay.ts`: Three.js scene, camera, hand overlay, and render loop update.
- `src/render/drumKit.ts`: Drum and cymbal geometry.
- `src/style.css`: Full-screen video and canvas overlay styling.

Run:

```powershell
cd v1-threejs-overlay
bun run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

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

The browser version is now the main direction:

```text
webcam video
  -> MediaPipe hand tracking
  -> Three.js hand overlay
  -> Three.js AR objects over video
```

Python remains useful for quick MediaPipe model tests, but Three.js rendering belongs in the browser for a fast WebGL overlay loop.

## Skipped For Now

These were intentionally left out to keep the prototype small:

- React or another UI framework
- Python-to-browser bridge
- WebSockets
- physics engine
- drum hit detection
- sound playback
- gesture state machine
- smoothing filters
- persistent hand identity tracking

Add these only when the basic visual placement and hand tracking feel good.
