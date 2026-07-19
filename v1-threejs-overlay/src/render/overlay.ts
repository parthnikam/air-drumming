import * as THREE from 'three'
import type { HandLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { HAND_CONNECTIONS, MAX_HANDS, MIRROR_VIDEO } from '../tracking/hand'
import { createDrumKit } from './drumKit'

export function createOverlay(app: HTMLElement, video: HTMLVideoElement) {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 2000)
  camera.position.z = 1000
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  app.appendChild(renderer.domElement)

  const jointGeometry = new THREE.SphereGeometry(7, 12, 12)
  const jointMaterial = new THREE.MeshBasicMaterial({ color: 0x35ff8a })
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00d9ff })
  const drumKit = createDrumKit(scene)
  // Key + fill lights so cylindrical shells show volume (not flat discs)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
  keyLight.position.set(220, 320, 700)
  const fillLight = new THREE.DirectionalLight(0xaaccff, 1.1)
  fillLight.position.set(-280, 80, 400)
  const rimLight = new THREE.DirectionalLight(0xffe0c0, 0.7)
  rimLight.position.set(0, -200, 300)
  scene.add(
    new THREE.HemisphereLight(0xffffff, 0x223344, 1.6),
    keyLight,
    fillLight,
    rimLight,
  )

  const hands = Array.from({ length: MAX_HANDS }, () => {
    const points = Array.from({ length: 21 }, () => new THREE.Vector3())
    const joints = points.map(() => {
      const joint = new THREE.Mesh(jointGeometry, jointMaterial)
      scene.add(joint)
      return joint
    })
    const linePositions = new Float32Array(HAND_CONNECTIONS.length * 6)
    const lines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial)
    lines.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    scene.add(lines)
    return { points, joints, linePositions, lines }
  })

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.left = -window.innerWidth / 2
    camera.right = window.innerWidth / 2
    camera.top = window.innerHeight / 2
    camera.bottom = -window.innerHeight / 2
    camera.updateProjectionMatrix()
    drumKit.scale.setScalar(Math.min(window.innerWidth / 750, window.innerHeight / 520, 1.45))
  }

  const toScenePoint = (point: NormalizedLandmark, target: THREE.Vector3) => {
    const videoAspect = video.videoWidth / video.videoHeight
    const viewAspect = window.innerWidth / window.innerHeight
    const drawWidth = videoAspect > viewAspect ? window.innerHeight * videoAspect : window.innerWidth
    const drawHeight = videoAspect > viewAspect ? window.innerHeight : window.innerWidth / videoAspect
    const x = (MIRROR_VIDEO ? 1 - point.x : point.x) * drawWidth + (window.innerWidth - drawWidth) / 2
    const y = point.y * drawHeight + (window.innerHeight - drawHeight) / 2
    return target.set(x - window.innerWidth / 2, window.innerHeight / 2 - y, -point.z * 350)
  }

  const update = (result: HandLandmarkerResult) => {
    for (let handIndex = 0; handIndex < MAX_HANDS; handIndex += 1) {
      const landmarks = result.landmarks[handIndex]
      const hand = hands[handIndex]
      hand.lines.visible = Boolean(landmarks)
      for (const joint of hand.joints) joint.visible = Boolean(landmarks)
      if (!landmarks) continue

      for (let i = 0; i < 21; i += 1) {
        toScenePoint(landmarks[i], hand.points[i])
        hand.joints[i].position.copy(hand.points[i])
      }

      for (let i = 0; i < HAND_CONNECTIONS.length; i += 1) {
        hand.points[HAND_CONNECTIONS[i][0]].toArray(hand.linePositions, i * 6)
        hand.points[HAND_CONNECTIONS[i][1]].toArray(hand.linePositions, i * 6 + 3)
      }
      hand.lines.geometry.attributes.position.needsUpdate = true
    }

    renderer.render(scene, camera)
  }

  resize()
  window.addEventListener('resize', resize)
  return { update }
}


