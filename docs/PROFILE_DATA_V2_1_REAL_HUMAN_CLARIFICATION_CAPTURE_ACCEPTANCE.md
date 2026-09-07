# PROFILE DATA V2.1 — Real Human Clarification Capture Integration Acceptance

Source checkpoint: **ed213a3**
Parent milestone: **PROFILE DATA V2**

## Goal

Turn the existing PROFILE DATA 03.27–03.29 clarification logic into a real user workflow without changing any production authority.

Before V2.1 the UI displayed deterministic clarification questions, but the 03.28 session was always built with no human answers. V2.1 adds an explicit human capture path.

## Human workflow

For each current 03.27 question:

1. The human reads the exact clarification question and required authority.
2. For `SOURCE_REFERENCE`, the human enters:
   - an answer/description;
   - source label;
   - source reference.
3. For `HUMAN_REVIEW_CONFIRMATION`, the human enters the result of the renewed review.
4. The human explicitly presses **Запази human answer · pending intake**.
5. The answer is passed to the existing 03.28 guided clarification session.
6. A valid captured answer may become a 03.29 `CANDIDATE_PENDING_HUMAN_INTAKE`.
7. The candidate is shown to the human for inspection.

## Important meaning

A captured human answer is **not evidence acceptance**.

A 03.29 candidate is **not a registered evidence submission** and does not satisfy a requirement.

V2.1 only closes the UI gap between “AI asks” and “human provides structured answer”.

## Deterministic helper

`src/profileData/profileDataV2HumanClarificationWorkflow.ts` provides:

- draft → typed 03.28 human answer conversion;
- required field checks;
- source label/reference enforcement for `SOURCE_REFERENCE`;
- deterministic upsert/removal by `questionKey`;
- explicit V2.1 safety constants.

## Safety boundaries

- REAL HUMAN ANSWER CAPTURE = YES
- HUMAN ACTION REQUIRED = YES
- CANDIDATE INTAKE ONLY = YES
- AUTOMATIC QUESTION ANSWERING = NO
- AUTOMATIC EVIDENCE FETCH = NO
- AUTOMATIC EVIDENCE REGISTRATION = NO
- AUTOMATIC EVIDENCE ACCEPTANCE = NO
- AUTOMATIC REQUIREMENT SATISFACTION = NO
- AUTOMATIC KNOWLEDGE RESOLUTION = NO
- MANUFACTURER APPROVAL = NO
- EXACT JOINT GEOMETRY VERIFIED = NO
- PRODUCTION COMPATIBILITY VALIDATED = NO
- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- PRODUCTION UNLOCK = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

## Acceptance

V2.1 is accepted when:

- valid source-reference answers can be captured;
- incomplete source-reference answers fail closed;
- renewed human-review answers can be captured without inventing a source reference;
- answer updates replace the same question deterministically;
- captured answers feed the existing 03.28 session;
- valid 03.28 answers feed the existing 03.29 pending candidate bridge;
- the UI exposes the human capture controls and candidate state;
- safety locks remain unchanged.
