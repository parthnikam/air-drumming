import * as THREE from 'three'
import type { HitPart, InstrumentId } from '../audio/soundMap'
import { classifyHit, type HitInstrument } from './zones'

/** MediaPipe landmark index for index fingertip. */
export const INDEX_TIP = 8

export type HitEvent = {
  instrumentId: InstrumentId
  part: HitPart
  /** 0..1 from strike speed */
  intensity: number
  handIndex: number
  speed: number
  point: THREE.Vector3
}

type TipState = {
  prev: THREE.Vector3
  hasPrev: boolean
  /** last part per instrument (or null if outside) */
  inside: Map<InstrumentId, HitPart | null>
  /** cooldown end time (ms) per instrument */
  coolUntil: Map<InstrumentId, number>
}

const MIN_SPEED = 95 // world units / second — ignore rests / slow drifts
const REF_SPEED = 920 // speed that maps to intensity ≈ 1
const COOLDOWN_MS = 110

export function createHitDetector(instruments: HitInstrument[]) {
  const tips: TipState[] = Array.from({ length: 2 }, () => ({
    prev: new THREE.Vector3(),
    hasPrev: false,
    inside: new Map(),
    coolUntil: new Map(),
  }))

  const events: HitEvent[] = []
  let lastTime = performance.now()

  /**
   * Feed index-tip world positions for each hand (null if hand missing).
   * Returns hit events for this frame (array reused; copy if you store it).
   */
  const update = (indexTips: Array<THREE.Vector3 | null>, now = performance.now()): HitEvent[] => {
    events.length = 0
    const dt = Math.max(1 / 120, Math.min(0.05, (now - lastTime) / 1000))
    lastTime = now

    for (let handIndex = 0; handIndex < indexTips.length; handIndex += 1) {
      const tip = indexTips[handIndex]
      const state = tips[handIndex]
      if (!tip) {
        state.hasPrev = false
        state.inside.clear()
        continue
      }

      if (!state.hasPrev) {
        state.prev.copy(tip)
        state.hasPrev = true
        for (const inst of instruments) {
          state.inside.set(inst.id, classifyHit(inst, tip))
        }
        continue
      }

      const speed = state.prev.distanceTo(tip) / dt
      const intensity = Math.min(1, Math.max(0, (speed - MIN_SPEED) / (REF_SPEED - MIN_SPEED)))

      for (const inst of instruments) {
        const part = classifyHit(inst, tip)
        const was = state.inside.get(inst.id) ?? null
        state.inside.set(inst.id, part)

        if (!part) continue
        // Fire on enter (or part change while moving fast enough)
        const entered = was === null || was !== part
        if (!entered) continue
        if (speed < MIN_SPEED) continue

        const cool = state.coolUntil.get(inst.id) ?? 0
        if (now < cool) continue

        state.coolUntil.set(inst.id, now + COOLDOWN_MS)
        events.push({
          instrumentId: inst.id,
          part,
          intensity: Math.max(0.08, intensity),
          handIndex,
          speed,
          point: tip.clone(),
        })
      }

      state.prev.copy(tip)
    }

    return events
  }

  return { update }
}

export type HitDetector = ReturnType<typeof createHitDetector>
