import './style.css'
import { createDrumPlayer } from './audio/drumPlayer'
import { startCamera } from './input/camera'
import { createOverlay } from './render/overlay'
import { startHandLandmarker } from './tracking/tracker'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <video id="camera" autoplay playsinline muted></video>
  <div id="status">Loading hand tracker and drum samples...</div>
`

const video = document.querySelector<HTMLVideoElement>('#camera')!
const status = document.querySelector<HTMLDivElement>('#status')!
const player = createDrumPlayer()
const overlay = createOverlay(app, video, player)

// Browsers block audio until a user gesture — unlock on first pointer/key
const unlockAudio = () => {
  void player.resume()
  window.removeEventListener('pointerdown', unlockAudio)
  window.removeEventListener('keydown', unlockAudio)
}
window.addEventListener('pointerdown', unlockAudio)
window.addEventListener('keydown', unlockAudio)

try {
  await startCamera(video)
  const [, handLandmarker] = await Promise.all([player.load(), startHandLandmarker()])
  status.textContent = 'Ready — strike drums with your index finger (click once to enable sound)'
  status.hidden = false
  window.setTimeout(() => {
    status.hidden = true
  }, 3200)

  handLandmarker.setOptions({ runningMode: 'VIDEO' })
  requestAnimationFrame(function frame() {
    overlay.update(handLandmarker.detectForVideo(video, performance.now()))
    requestAnimationFrame(frame)
  })
} catch (error) {
  status.hidden = false
  status.textContent =
    error instanceof Error ? error.message : 'Could not start camera, tracker, or audio.'
}
