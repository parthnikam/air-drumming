/**
 * Sample map for the AR kit.
 *
 * Placement (screen space, mirrored webcam):
 *   [hi_hat]  [floor_tom] [rack_tom] [snare] [kick]  [ride]
 *
 * Parts:
 *   drums   → head | rim | shell
 *   cymbals → bell | bow | edge
 *
 * Every instrument uses its own sample family so roles never blur
 * (no shared “generic hit” across kick / snare / toms).
 *
 * Sample files live in /Samples/*.wav (served from public/Samples).
 */

export type DrumPart = 'head' | 'rim' | 'shell'
export type CymbalPart = 'bell' | 'bow' | 'edge'
export type HitPart = DrumPart | CymbalPart

export type InstrumentId =
  | 'floor_tom'
  | 'rack_tom'
  | 'snare'
  | 'kick'
  | 'hi_hat'
  | 'ride'

export type InstrumentKind = 'drum' | 'cymbal'

/**
 * Filename → musical role (why this file, not another):
 *
 * KICK (largest right drum)
 *   head  kick-acoustic01 — full beater-on-head body (main kick)
 *   rim   kick-tight      — tight hoop / clicky attack
 *   shell kick-stomp      — heavy body knock (not a second beater hit)
 *
 * SNARE (inner-right)
 *   head  snare-acoustic01 — center snare crack with wires
 *   rim   snare-block      — rimshot / rim-block click
 *   shell snare-noise      — dry shell / wire scrape (side stick family)
 *
 * RACK TOM (inner-left, smaller → higher)
 *   head  tom-rototom      — tighter / higher tom character
 *   rim   perc-short       — short metallic rim tick
 *   shell tom-short        — quick shell/body tap (same tom family)
 *
 * FLOOR TOM (large left → lower)
 *   head  tom-acoustic02   — deeper acoustic tom body
 *   rim   perc-metal       — heavier metal rim click than rack
 *   shell perc-hollow      — hollow wooden shell knock
 *
 * HI-HAT (left cymbal)
 *   bell  hihat-ring       — tight chick / ring
 *   bow   hihat-acoustic01 — closed hat face
 *   edge  openhat-acoustic01 — open wash
 *
 * RIDE (right cymbal)
 *   bell  ride-acoustic02  — ride bell ping
 *   bow   ride-acoustic01  — ride bow pattern
 *   edge  crash-acoustic   — edge crash (not a second hat)
 */
export const SOUND_MAP: Record<InstrumentId, Partial<Record<HitPart, string>>> = {
  kick: {
    head: '/Samples/kick-acoustic01.wav',
    rim: '/Samples/kick-tight.wav',
    shell: '/Samples/kick-stomp.wav',
  },

  snare: {
    head: '/Samples/snare-acoustic01.wav',
    rim: '/Samples/snare-block.wav',
    shell: '/Samples/snare-noise.wav',
  },

  rack_tom: {
    head: '/Samples/tom-rototom.wav',
    rim: '/Samples/perc-short.wav',
    shell: '/Samples/tom-short.wav',
  },

  floor_tom: {
    head: '/Samples/tom-acoustic02.wav',
    rim: '/Samples/perc-metal.wav',
    shell: '/Samples/perc-hollow.wav',
  },

  hi_hat: {
    bell: '/Samples/hihat-ring.wav',
    bow: '/Samples/hihat-acoustic01.wav',
    edge: '/Samples/openhat-acoustic01.wav',
  },

  ride: {
    bell: '/Samples/ride-acoustic02.wav',
    bow: '/Samples/ride-acoustic01.wav',
    edge: '/Samples/crash-acoustic.wav',
  },
}

/** Every unique sample path used by the kit (for preload). */
export function allSamplePaths(): string[] {
  const paths = new Set<string>()
  for (const parts of Object.values(SOUND_MAP)) {
    for (const path of Object.values(parts)) {
      if (path) paths.add(path)
    }
  }
  return [...paths]
}
