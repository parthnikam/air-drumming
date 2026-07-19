import * as THREE from 'three'
import type { CymbalPart, DrumPart, HitPart, InstrumentId, InstrumentKind } from '../audio/soundMap'

export type HitInstrument = {
  id: InstrumentId
  kind: InstrumentKind
  /** Root group for this instrument (world matrix drives local tests). */
  group: THREE.Group
  /** Drum shell radius / cymbal outer radius in local units. */
  radius: number
  /** Drum barrel depth along local Z. Unused for cymbals. */
  depth: number
  /** Meshes to flash on hit. */
  highlightMeshes: THREE.Mesh[]
}

const _local = new THREE.Vector3()
const _inv = new THREE.Matrix4()

/**
 * Classify a world-space point against one instrument.
 * Returns the minimal part id or null if outside all zones.
 */
export function classifyHit(instrument: HitInstrument, worldPoint: THREE.Vector3): HitPart | null {
  instrument.group.updateWorldMatrix(true, false)
  _inv.copy(instrument.group.matrixWorld).invert()
  _local.copy(worldPoint).applyMatrix4(_inv)

  if (instrument.kind === 'drum') return classifyDrum(instrument, _local)
  return classifyCymbal(instrument, _local)
}

function classifyDrum(instrument: HitInstrument, local: THREE.Vector3): DrumPart | null {
  const R = instrument.radius
  const depth = instrument.depth
  const r = Math.hypot(local.x, local.y)
  const z = local.z
  const half = depth / 2

  // Front-face band (drumhead + rim) — local +Z is the playing head
  const headBandMin = half - 22
  const headBandMax = half + 28
  const inHeadBand = z >= headBandMin && z <= headBandMax

  if (inHeadBand) {
    // Rim first (outer ring) so edge strikes win over head
    if (r >= R * 0.82 && r <= R * 1.18) return 'rim'
    if (r <= R * 0.82) return 'head'
  }

  // Shell: along the barrel, near the outer wall
  const inBarrel = z >= -half - 12 && z <= half - 8
  if (inBarrel && r >= R * 0.72 && r <= R * 1.2) return 'shell'

  return null
}

function classifyCymbal(instrument: HitInstrument, local: THREE.Vector3): CymbalPart | null {
  const R = instrument.radius
  const r = Math.hypot(local.x, local.y)
  // Thin plate around local z ≈ 0 (group tilt handled via matrixWorld)
  if (Math.abs(local.z) > 40) return null
  if (r > R * 1.1) return null

  // Three radial zones — same geometry language as a real cymbal plate:
  //   bell (dome) → bow (main face) → edge (crash / open tip)
  if (r <= R * 0.28) return 'bell'
  if (r <= R * 0.68) return 'bow'
  return 'edge'
}
