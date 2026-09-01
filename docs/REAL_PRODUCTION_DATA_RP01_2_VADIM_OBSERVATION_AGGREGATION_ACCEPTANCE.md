# REAL PRODUCTION DATA — RP01.2 Observation Aggregation / Repeated Pattern Foundation

## Purpose

RP01.2 groups the source-preserving RP01.1 SkyGlazing XML/LTE observations from the
locked `Вадим-2` sample pair.

The goal is to measure repetition without converting repetition into engineering truth.

## Aggregation levels

Per observed profile code, RP01.2 records:

- XML observation count;
- LTE observation count;
- exact-barcode XML↔LTE correlation count;
- LTE-only count;
- explicit LTE position-word counts (`Left`, `Right`, `Upper`, `Bottom`);
- `UNLABELED` when no supported position word is present;
- exact four-field cut tuple frequency: `sxB`, `dxB`, `sxC`, `dxC`;
- machining operation-name frequency;
- exact operation fingerprints including raw positions, face point, angles, tool and
  sorted parameter values.

## Cut tuple boundary

`Length` is deliberately not part of the RP01.2 cut-tuple pattern key.

This phase is counting repetition of the four explicit cut fields only. It is not claiming
that the same tuple applies to every length, every assembly, every product or every future
project.

## Repeated observation

A pattern observed at least twice is marked:

`REPEATED_OBSERVATION`

A pattern observed once is marked:

`SINGLE_OBSERVATION`

These labels are frequency descriptions only.

`REPEATED_OBSERVATION != PRODUCTION_RULE`

## Real-sample verification

The focused test reads the existing locked `local-samples/phase05a` XML/LTE pair and
verifies the aggregation against the current Vadim evidence corpus.

It does not copy the private source files into the repository.

## Safety boundary

RP01.2 does not:

- infer a profile role;
- confirm a system identity;
- infer a universal machining rule;
- infer a universal cut rule;
- create automatic geometry;
- create machine output;
- approve production.

All aggregate records remain observation-only:

- `aggregationStatus = OBSERVATION_AGGREGATION_ONLY`
- `universalRuleInferenceAllowed = false`
- `productionRuleCreated = false`
- `machineReady = false`
- `productionApproved = false`

## Acceptance

PASS requires:

- RP01.2 focused real-sample tests;
- RP01.1 regression;
- Nadezhda evidence regression and source audit;
- WP78 project-system bridge regression;
- WP78 evidence-aware gate regression;
- lint;
- production build.
