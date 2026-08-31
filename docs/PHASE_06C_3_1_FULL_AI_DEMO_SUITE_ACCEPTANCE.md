# PHASE 06C.3.1 — FULL AI DEMO SUITE

## Goal
Provide a safe, one-click demo entry for the complete FacadeFlow AI workspace before real project/engineering data is available.

## Demo coverage
The AI intake screen exposes six explicit DEMO stations:

1. Project / documents
2. Guided window
3. Guided door
4. Sketch / drawing
5. Manual without AI
6. Data and catalogues / knowledge base

All six job contexts remain visible and selectable in the normal context section.

## Safety contract
- Every preset value is visibly prefixed or described as DEMO.
- Project/documents demo does not invent an uploaded file or parsed evidence.
- Sketch demo does not invent a sketch file, OCR result, extracted geometry or evidence reference.
- Guided window/door demos stop at NEEDS_REVIEW and never set HUMAN_CONFIRMED automatically.
- The knowledge-base demo does not fill missing engineering rules, hardware, glazing or compatibility data with invented values.
- AI model remains NOT_CONNECTED.
- Automatic geometry remains disabled.
- Persistence remains absent.
- Machine-ready and production-approved remain false.

## Acceptance
- `npm run test:phase06c3_1`
- Regression: `npm run test:phase06c3`
- `npm run lint`
- `npm run build`
- Human visual review confirms the DEMO centre is understandable and clearly separated from real data.
