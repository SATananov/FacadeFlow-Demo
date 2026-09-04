# PROFILE DATA 02.2.1 — Nadezhda Confirmed Geometry + Catalogue Grouping

## Scope

This slice records the measurement interpretation confirmed by the Nadezhda technical source and improves the external catalogue-reference UX without changing production geometry or authority.

### Nadezhda / PRELUDE 60 — human-confirmed measurement meaning

- `482.30` FRAME: full dimension `64 mm`, one `22 mm` side zone, visible width `42 mm` → `64 − 22 = 42 mm`.
- `482.05` SASH: full sash dimension `78 mm`, `22 mm` zone toward the holder, visible width `56 mm` → `78 − 22 = 56 mm`.
- `482.21` MULLION: full dimension `84 mm`, two `22 mm` side zones, visible width `40 mm` → `84 − 22 − 22 = 40 mm`.

Source ownership remains `Надежда`; `Бат Трифон` is stored as the technical contact/provenance person.

These records are `HUMAN_CONFIRMED` knowledge evidence only. They do not overwrite the manufacturer catalogue, the existing PRELUDE working geometry registry, rule validation, or production gates automatically.

### Catalogue-reference UX

The eleven external references remain unchanged and `REFERENCE_ONLY`, but are rendered as six manufacturer groups:

- KMG — PRELUDE 60, PRESTIGE 70
- VIVA PLAST — System 6400, System 7500
- WEISS PROFIL — SMART WP4000
- PROFITEM — Q60, Q72
- FRAMEX — Framex 58, 71, 80
- REHAU — Euro-Design 70

KMG is initially expanded because PRELUDE 60 is the current working reference; the other manufacturers are collapsible to keep the catalogue usable as the source library grows.

## Safety boundary

- automatic catalogue merge: **NO**
- automatic geometry overwrite: **NO**
- automatic rule validation: **NO**
- machine ready: **NO**
- production approved: **NO**

## Acceptance intent

1. The three Nadezhda values have explicit full/visible/22 mm semantics.
2. The mullion is modeled with two 22 mm zones.
3. The UI no longer says the 482.05 meaning is unresolved.
4. External catalogue sources are grouped by manufacturer without changing the source records.
5. No production authority is added.
