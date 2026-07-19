import './style.css'
import { startCamera } from './input/camera'
import { createOverlay } from './render/overlay'
import { startHandLandmarker } from './tracking/tracker'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <video id="camera" autoplay playsinline muted></video>
  <div id="status">Loading hand tracker...</div>
`

const video = document.querySelector<HTMLVideoElement>('#camera')!
const status = document.querySelector<HTMLDivElement>('#status')!
const overlay = createOverlay(app, video)

try {
  await startCamera(video)
  const handLandmarker = await startHandLandmarker()
  status.hidden = true

  handLandmarker.setOptions({ runningMode: 'VIDEO' })
  requestAnimationFrame(function frame() {
    overlay.update(handLandmarker.detectForVideo(video, performance.now()))
    requestAnimationFrame(frame)
  })
} catch (error) {
  status.textContent = error instanceof Error ? error.message : 'Could not start camera or hand tracker.'
}
