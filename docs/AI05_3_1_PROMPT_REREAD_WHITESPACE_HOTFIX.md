# AI05.3.1 Prompt reread whitespace hotfix

Problem: the textarea source was only trimmed in the UI, while the deterministic interpreter normalized all whitespace. Multi-line descriptions therefore remained permanently stale immediately after rereading.

Fix:
- normalize textarea whitespace before stale comparison;
- show `Разчети отново` on the real action button when stale;
- keep the stale status badge informational (`ТЕКСТЪТ Е ПРОМЕНЕН`);
- add regression coverage for multiline prompt reread.

Safety is unchanged: automatic production geometry, machine readiness and production approval remain disabled.
