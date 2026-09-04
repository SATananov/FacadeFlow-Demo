# PROFILE DATA 02.2 — Catalogue Library Expansion

## Scope

This slice expands the external reference library only. It does not promote catalogue values into selectable profile geometry, rules, or production authority.

Registered source records:

- KMG PRELUDE 60 — official BG technical PDF
- KMG PRESTIGE 70 — official BG technical PDF
- VIVA PLAST System 6400 — technical PDF
- VIVA PLAST System 7500 — same technical PDF, separate system record
- WEISS PROFIL SMART WP4000 — technical PDF
- PROFITEM Q60 — shared Q60/Q72 technical PDF
- PROFITEM Q72 — shared Q60/Q72 technical PDF
- Framex 58 — technical PDF
- Framex 71 — technical PDF
- Framex 80 — technical PDF
- REHAU Euro-Design 70 — official product reference page

## Source separation

External manufacturer documents remain `REFERENCE_ONLY`.

They do not:

- overwrite Nadezhda / human-reviewed measurements;
- overwrite PRELUDE working geometry;
- auto-create selectable catalogue profiles;
- auto-validate compatibility rules;
- unlock production or machine output.

The Nadezhda production-knowledge layer and Bat Trifon provenance remain separate and unchanged.

## UI

The catalogue workspace now shows:

- number of external source records;
- system depth;
- source type;
- source host;
- document language;
- focus profile codes where explicitly registered;
- PDF or official-source action according to source kind.

## Safety boundary

`MACHINE READY = NO`

`PRODUCTION APPROVED = NO`
