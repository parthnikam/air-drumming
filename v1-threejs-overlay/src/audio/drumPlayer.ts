import { allSamplePaths, SOUND_MAP, type HitPart, type InstrumentId } from './soundMap'

export type PlayHitOptions = {
  instrumentId: InstrumentId
  part: HitPart
  /** 0..1 strike strength from velocity */
  intensity: number
}

/**
 * Web Audio sample player. Decodes once, polyphonic oneshots per hit.
 * Call resume() after a user gesture if the browser suspended the context.
 */
export function createDrumPlayer() {
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.gain.value = 0.85
  master.connect(ctx.destination)

  const buffers = new Map<string, AudioBuffer>()
  let loadPromise: Promise<void> | null = null

  const load = async () => {
    if (loadPromise) return loadPromise
    loadPromise = (async () => {
      await Promise.all(
        allSamplePaths().map(async (path) => {
          const res = await fetch(path)
          if (!res.ok) throw new Error(`Failed to load sample: ${path}`)
          const raw = await res.arrayBuffer()
          const buffer = await ctx.decodeAudioData(raw.slice(0))
          buffers.set(path, buffer)
        }),
      )
    })()
    return loadPromise
  }

  const resume = async () => {
    if (ctx.state === 'suspended') await ctx.resume()
  }

  const playHit = ({ instrumentId, part, intensity }: PlayHitOptions) => {
    const path = SOUND_MAP[instrumentId][part]
    if (!path) return false
    const buffer = buffers.get(path)
    if (!buffer) return false

    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    // Soft curve so gentle hits stay audible; hard hits near full level
    const level = 0.12 + Math.pow(Math.min(1, Math.max(0, intensity)), 1.15) * 0.88
    gain.gain.value = level
    source.connect(gain)
    gain.connect(master)
    source.start()
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
    }
    return true
  }

  return { load, resume, playHit, context: ctx }
}

export type DrumPlayer = ReturnType<typeof createDrumPlayer>
