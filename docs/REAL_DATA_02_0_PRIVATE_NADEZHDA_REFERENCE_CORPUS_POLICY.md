# REAL DATA 02.0 — Private Nadezhda Reference Corpus Policy

## Purpose

The real project documents supplied by Nadezhda / the human domain expert are reference evidence for understanding recurring project-document structure. They are **not application templates**, **not public demo projects**, and **not production authority**.

## Repository boundary

- Original customer/project PDF, DOCX, images and extracted customer-identifying content stay outside tracked repository content.
- If a local working copy is needed, it must live under `local-samples/nadezhda-projects/`, which is already Git-ignored and excluded from `SHAREABLE_CLEAN` checkpoints.
- They must not be committed to Git and must not be copied into tracked test fixtures.
- Regression fixtures stored in the repository must be synthetic and must describe only structural patterns needed by tests.
- The application may later ingest a private local source, but that source remains evidence and does not automatically become an active project.

## Learning boundary

The reference corpus may support schema and parser design for recurring patterns such as:

- optional floor / section hierarchy;
- module reference, quantity, width and height;
- mixed PVC / aluminium product groups;
- multiple offer variants over the same project geometry;
- group defaults with module-level overrides;
- area, per-piece, linear-meter and fixed pricing components;
- included and excluded commercial items.

The corpus must **not** be used to infer missing opening directions, profile roles, construction details, prices, glazing, hardware or production decisions when the source does not state them.

## Safety invariants

- same width + height does not mean same module;
- source evidence does not authorize automatic reuse;
- source evidence does not authorize template promotion;
- source evidence does not authorize production or machine output;
- unresolved data remains unresolved until a human confirms it.
