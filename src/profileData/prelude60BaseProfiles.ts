export const PRELUDE_60_SYSTEM_ID = 'PRELUDE_60' as const
export const PRELUDE_60_SYSTEM_LABEL = 'PRELUDE 60' as const
export const PRELUDE_60_SYSTEM_DEPTH_MM = 60 as const

export const PRELUDE_60_PROFILE_CODES = Object.freeze({
  frame: '482.30',
  sash: '482.05',
  mullion: '482.21',
} as const)

export const PRELUDE_60_CONFIRMED_BASE_GEOMETRY = Object.freeze({
  [PRELUDE_60_PROFILE_CODES.frame]: Object.freeze({
    role: 'FRAME' as const,
    profileHeightMm: 64,
    visibleWidthMm: 42,
  }),
  [PRELUDE_60_PROFILE_CODES.sash]: Object.freeze({
    role: 'SASH' as const,
    profileHeightMm: 78,
    visibleWidthMm: 56,
  }),
  [PRELUDE_60_PROFILE_CODES.mullion]: Object.freeze({
    role: 'MULLION' as const,
    profileHeightMm: 84,
    visibleWidthMm: 40,
  }),
})
