import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { MAX_HANDS } from './hand'

export async function startHandLandmarker() {
  const fileset = await FilesetResolver.forVisionTasks('/node_modules/@mediapipe/tasks-vision/wasm')
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: '/tasks/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: MAX_HANDS,
  })
}

