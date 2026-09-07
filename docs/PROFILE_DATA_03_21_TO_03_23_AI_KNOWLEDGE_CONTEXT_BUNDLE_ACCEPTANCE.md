# PROFILE DATA 03.21–03.23 — AI Knowledge Context Bundle Acceptance

## Scope

This bundle converts the existing read-only PRELUDE 60 system knowledge gate into an AI-consumable diagnostic context.

### 03.21 — AI Decision Context

- Separates reviewed knowledge into `knownItems` and unresolved knowledge into `unknownItems`.
- Every unknown item carries the required authority/evidence class.
- Unknown technical data may not be inferred or promoted to known.
- Upstream mismatch and stale review remain fail-closed.

### 03.22 — AI Claim Boundary

The AI may only:

- describe current reviewed knowledge coverage;
- describe explicit knowledge gaps;
- request human evidence/review.

The AI may not claim or infer:

- manufacturer approval;
- exact joint geometry;
- production compatibility;
- automatic profile selection;
- automatic geometry;
- validated production rules;
- production unlock;
- machine-ready status.

### 03.23 — AI-Consumable Knowledge Context

Exports a serializable context with:

- `known[]`;
- `unknown[]`;
- `humanEvidenceRequests[]`;
- explicit response policy;
- hard production safety locks;
- an instruction that unknown values must remain unknown and require human evidence.

## Acceptance boundary

`KNOWLEDGE CONTEXT COMPLETE` means only that the currently modelled knowledge requirements are reviewed/resolved for the knowledge layer. It does **not** mean manufacturer approval, exact joint geometry, production compatibility, automatic geometry, production unlock, or machine readiness.

## Safety invariants

- AI KNOWLEDGE CONTEXT = YES
- AI MAY SAY WHAT IS KNOWN = YES when current/non-stale
- AI MAY SAY WHAT IS UNKNOWN = YES when current/non-stale
- AI MAY REQUEST HUMAN EVIDENCE = YES unless upstream conflict blocks the context
- AI MAY GUESS MISSING TECHNICAL DATA = NO
- UNKNOWN MAY BECOME KNOWN WITHOUT REVIEW = NO
- MANUFACTURER APPROVAL = NO
- EXACT JOINT GEOMETRY VERIFIED = NO
- PRODUCTION COMPATIBILITY VALIDATED = NO
- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC GEOMETRY = NO
- PRODUCTION RULES VALIDATED = NO
- PRODUCTION UNLOCK = NO
- MACHINE READY = NO
