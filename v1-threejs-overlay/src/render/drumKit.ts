import * as THREE from 'three'
import type { InstrumentId } from '../audio/soundMap'
import type { HitInstrument } from '../collision/zones'

/** x, y, radius, shell depth, shell color, role id */
const DRUMS: ReadonlyArray<readonly [number, number, number, number, number, InstrumentId]> = [
  [-280, -240, 115, 165, 0x293241, 'floor_tom'],
  [-90, -215, 92, 140, 0x3d5a80, 'rack_tom'],
  [105, -218, 98, 145, 0x4d908e, 'snare'],
  [310, -250, 130, 180, 0x22223b, 'kick'],
]

/**
 * Cymbals are different instruments (real-kit roles), not clones:
 *   hi_hat — smaller, left, tighter bronze
 *   ride   — larger, right, brighter brass
 * Tuple: x, y, radius, color, id
 */
const CYMBALS: ReadonlyArray<readonly [number, number, number, number, InstrumentId]> = [
  [-480, -55, 118, 0xb8922a, 'hi_hat'],
  [490, -85, 158, 0xe0b83a, 'ride'],
]

function createDrum(
  x: number,
  y: number,
  radius: number,
  depth: number,
  color: number,
  materials: {
    shell: THREE.MeshStandardMaterial
    head: THREE.MeshStandardMaterial
    rim: THREE.MeshStandardMaterial
    inner: THREE.MeshStandardMaterial
  },
) {
  const drum = new THREE.Group()
  const highlightMeshes: THREE.Mesh[] = []

  const shellMat = materials.shell.clone()
  shellMat.color.setHex(color)
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 48, 1, true),
    shellMat,
  )
  shell.rotation.x = Math.PI / 2

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(radius - 6, radius - 6, depth - 4, 48, 1, true),
    materials.inner,
  )
  inner.rotation.x = Math.PI / 2
  inner.scale.x = -1

  const headMat = materials.head.clone()
  const headFront = new THREE.Mesh(new THREE.CircleGeometry(radius - 8, 48), headMat)
  headFront.position.z = depth / 2

  const headBack = new THREE.Mesh(new THREE.CircleGeometry(radius - 8, 48), materials.head.clone())
  headBack.position.z = -depth / 2
  headBack.rotation.y = Math.PI

  const rimMat = materials.rim.clone()
  const rimFront = new THREE.Mesh(new THREE.TorusGeometry(radius - 2, 5, 12, 48), rimMat)
  rimFront.position.z = depth / 2 + 1

  const rimBack = new THREE.Mesh(
    new THREE.TorusGeometry(radius - 2, 4, 12, 48),
    materials.rim.clone(),
  )
  rimBack.position.z = -depth / 2 - 1

  const endCapFront = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 2, radius + 2, 10, 48),
    materials.rim.clone(),
  )
  endCapFront.rotation.x = Math.PI / 2
  endCapFront.position.z = depth / 2 - 2

  const endCapBack = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 2, radius + 2, 8, 48),
    materials.rim.clone(),
  )
  endCapBack.rotation.x = Math.PI / 2
  endCapBack.position.z = -depth / 2 + 2

  // Playing surfaces flash on hit
  highlightMeshes.push(shell, headFront, rimFront, endCapFront)

  drum.add(shell, inner, headFront, headBack, rimFront, rimBack, endCapFront, endCapBack)
  drum.rotation.x = -0.45
  drum.position.set(x, y, depth * 0.15)
  return { drum, highlightMeshes }
}

function createCymbal(
  x: number,
  y: number,
  radius: number,
  color: number,
  id: InstrumentId,
) {
  const cymbal = new THREE.Group()
  // Hi-hat is a tighter pair look; ride is a wider single plate
  const isHiHat = id === 'hi_hat'
  const plateMat = new THREE.MeshStandardMaterial({
    color,
    roughness: isHiHat ? 0.28 : 0.16,
    metalness: isHiHat ? 0.65 : 0.8,
  })
  const bellMat = new THREE.MeshStandardMaterial({
    color: isHiHat ? 0xc4a035 : 0xf0d060,
    roughness: 0.14,
    metalness: 0.85,
  })
  // Subtle bow ring tint so the three zones are visually hinted
  const bowRingMat = new THREE.MeshStandardMaterial({
    color: isHiHat ? 0x9a7a28 : 0xd4a82e,
    roughness: 0.35,
    metalness: 0.55,
  })

  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.86, radius, isHiHat ? 12 : 16, 64),
    plateMat,
  )
  plate.rotation.x = Math.PI / 2

  // Second thinner disc for hi-hat "pair" silhouette
  if (isHiHat) {
    const bottom = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.84, radius * 0.96, 8, 64),
      plateMat.clone(),
    )
    bottom.rotation.x = Math.PI / 2
    bottom.position.z = -10
    cymbal.add(bottom)
  }

  const bowRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.48, 3.5, 8, 48),
    bowRingMat,
  )
  bowRing.position.z = 8

  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(radius * (isHiHat ? 0.22 : 0.28), 24, 12),
    bellMat,
  )
  bell.scale.y = 0.35
  bell.position.z = isHiHat ? 12 : 18

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(isHiHat ? 4 : 5, isHiHat ? 4 : 5, isHiHat ? 100 : 130, 12),
    new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.8, roughness: 0.25 }),
  )
  stem.position.y = isHiHat ? -55 : -75
  stem.position.z = -10

  cymbal.add(plate, bowRing, bell, stem)
  cymbal.rotation.x = isHiHat ? -0.4 : -0.58
  cymbal.position.set(x, y, isHiHat ? 24 : 36)
  return { cymbal, highlightMeshes: [plate, bell, bowRing] as THREE.Mesh[] }
}

export type DrumKitHandle = {
  kit: THREE.Group
  instruments: HitInstrument[]
  /** Brief emissive flash on hit for the given instrument. */
  flash: (id: InstrumentId, intensity: number) => void
}

export function createDrumKit(scene: THREE.Scene): DrumKitHandle {
  const materials = {
    shell: new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.12,
    }),
    head: new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.55,
      metalness: 0.02,
    }),
    rim: new THREE.MeshStandardMaterial({
      color: 0xe9ecef,
      roughness: 0.22,
      metalness: 0.55,
    }),
    inner: new THREE.MeshStandardMaterial({
      color: 0x1a1a1f,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  }

  const kit = new THREE.Group()
  const instruments: HitInstrument[] = []
  const flashUntil = new Map<InstrumentId, number>()
  const baseEmissive = new Map<THREE.Mesh, number>()

  for (const [x, y, radius, depth, color, id] of DRUMS) {
    const { drum, highlightMeshes } = createDrum(x, y, radius, depth, color, materials)
    kit.add(drum)
    for (const mesh of highlightMeshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial
      baseEmissive.set(mesh, mat.emissiveIntensity ?? 0)
    }
    instruments.push({
      id,
      kind: 'drum',
      group: drum,
      radius,
      depth,
      highlightMeshes,
    })
  }

  for (const [x, y, radius, color, id] of CYMBALS) {
    const { cymbal, highlightMeshes } = createCymbal(x, y, radius, color, id)
    kit.add(cymbal)
    for (const mesh of highlightMeshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial
      baseEmissive.set(mesh, mat.emissiveIntensity ?? 0)
    }
    instruments.push({
      id,
      kind: 'cymbal',
      group: cymbal,
      radius,
      depth: id === 'hi_hat' ? 12 : 16,
      highlightMeshes,
    })
  }

  scene.add(kit)

  const flash = (id: InstrumentId, intensity: number) => {
    const inst = instruments.find((i) => i.id === id)
    if (!inst) return
    const until = performance.now() + 90 + intensity * 70
    flashUntil.set(id, until)
    for (const mesh of inst.highlightMeshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.emissive = new THREE.Color(0xfff2c4)
      mat.emissiveIntensity = 0.35 + intensity * 0.9
    }
  }

  // Decay flashes each frame via kit userData hook from overlay
  const tickFlash = (now = performance.now()) => {
    for (const inst of instruments) {
      const until = flashUntil.get(inst.id)
      if (until === undefined) continue
      if (now < until) continue
      flashUntil.delete(inst.id)
      for (const mesh of inst.highlightMeshes) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = baseEmissive.get(mesh) ?? 0
        mat.emissive.setHex(0x000000)
      }
    }
  }

  // Attach tick for overlay loop without expanding return surface too much
  kit.userData.tickFlash = tickFlash

  return { kit, instruments, flash }
}
