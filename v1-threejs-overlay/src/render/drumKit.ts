import * as THREE from 'three'

/** x, y, radius, shell depth (length of cylinder), shell color */
const DRUMS = [
  [-280, -240, 115, 165, 0x293241],
  [-90, -215, 92, 140, 0x3d5a80],
  [105, -218, 98, 145, 0x4d908e],
  [310, -250, 130, 180, 0x22223b],
] as const

const CYMBALS = [
  [-480, -70],
  [480, -70],
] as const

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

  // Main cylindrical shell (axis along local Y; we rotate to face the camera)
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 48, 1, true),
    materials.shell.clone(),
  )
  shell.material.color.setHex(color)
  shell.rotation.x = Math.PI / 2

  // Inner wall so the hollow body reads in 3D
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(radius - 6, radius - 6, depth - 4, 48, 1, true),
    materials.inner,
  )
  inner.rotation.x = Math.PI / 2
  inner.scale.x = -1 // flip normals to face inward

  // Front and back drumheads (flat discs capping the cylinder)
  const headFront = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 8, 48),
    materials.head,
  )
  headFront.position.z = depth / 2

  const headBack = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 8, 48),
    materials.head,
  )
  headBack.position.z = -depth / 2
  headBack.rotation.y = Math.PI

  // Metal rims around each head
  const rimFront = new THREE.Mesh(
    new THREE.TorusGeometry(radius - 2, 5, 12, 48),
    materials.rim,
  )
  rimFront.position.z = depth / 2 + 1

  const rimBack = new THREE.Mesh(
    new THREE.TorusGeometry(radius - 2, 4, 12, 48),
    materials.rim,
  )
  rimBack.position.z = -depth / 2 - 1

  // Thick rim caps (short solid cylinders) so ends feel solid, not paper-thin
  const endCapFront = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 2, radius + 2, 10, 48),
    materials.rim,
  )
  endCapFront.rotation.x = Math.PI / 2
  endCapFront.position.z = depth / 2 - 2

  const endCapBack = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 2, radius + 2, 8, 48),
    materials.rim,
  )
  endCapBack.rotation.x = Math.PI / 2
  endCapBack.position.z = -depth / 2 + 2

  drum.add(shell, inner, headFront, headBack, rimFront, rimBack, endCapFront, endCapBack)

  // Slight pitch so the cylindrical side wall is visible under an orthographic camera
  drum.rotation.x = -0.45
  drum.position.set(x, y, depth * 0.15)
  return drum
}

function createCymbal(x: number, y: number, material: THREE.MeshStandardMaterial) {
  const cymbal = new THREE.Group()
  // True 3D cymbal disc (tapered short cylinder)
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(120, 140, 14, 64),
    material,
  )
  plate.rotation.x = Math.PI / 2

  const bell = new THREE.Mesh(new THREE.SphereGeometry(36, 24, 12), material)
  bell.scale.y = 0.35
  bell.position.z = 16

  // Stand stem for depth cue
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 120, 12),
    new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.8, roughness: 0.25 }),
  )
  stem.position.y = -70
  stem.position.z = -10

  cymbal.add(plate, bell, stem)
  cymbal.rotation.x = -0.55
  cymbal.position.set(x, y, 30)
  return cymbal
}

export function createDrumKit(scene: THREE.Scene) {
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

  const cymbalMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6a928,
    roughness: 0.18,
    metalness: 0.75,
  })

  const kit = new THREE.Group()

  for (const [x, y, radius, depth, color] of DRUMS) {
    kit.add(createDrum(x, y, radius, depth, color, materials))
  }

  for (const [x, y] of CYMBALS) {
    kit.add(createCymbal(x, y, cymbalMaterial))
  }

  scene.add(kit)
  return kit
}
