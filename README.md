# FacadeFlow Demo

**Human-gated AI-assisted workflow for façade/window/door project understanding, conceptual construction preparation and evidence-driven technical review.**

FacadeFlow превръща човешко описание, проектни източници и профилни знания в структурирано изделие, концептуален чертеж и editable constructor preparation, без да представя непотвърдени технически знания като производствена истина.

> **Safety contract:** AI предложение ≠ инженерно одобрение ≠ производствена готовност ≠ machine-ready output.

## Current checkpoint

QA02 е maintenance/hardening delta върху GitHub base checkpoint **`9d185aa`** (`workflow: integrate conceptual drawing through manufacturing gates`).

`9d185aa` съдържа интегрирания **REAL USER WORKFLOW V1 + V2–V6**, текущата PROFILE DATA knowledge/evidence линия и fail-closed production/manufacturing gates. QA02 коригира regression coverage, премахва паралелния legacy Human Review panel от normal prompt route и актуализира current documentation.

QA02 не трябва да се счита за затворен checkpoint преди локално:

```bash
npm ci
npm run verify
git diff --check
git status --short
```

След commit/push трябва да се потвърди `origin/<branch>...HEAD = 0 0` и да се създаде canonical `SHAREABLE_CLEAN` ZIP чрез repository checkpoint generator-а.

Текущият архитектурен source of truth е [docs/CURRENT_ARCHITECTURE_STATUS.md](docs/CURRENT_ARCHITECTURE_STATUS.md).

---

## Какво е FacadeFlow днес

Основната продуктова посока е:

`човек / документ / каталог → canonical intent → human clarification → conceptual drawing → human correction/review → editable constructor preparation → locked production validation → locked manufacturing handoff`

FacadeFlow е проектиран така, че човек без дълбоки познания по профилни системи да може да опише изискването си нормално, а системата да структурира известното, да посочи неизвестното и да поиска човешко уточнение вместо да измисля технически факти.

### REAL USER WORKFLOW V1

V1 е natural-language clarification layer:

1. разчита локално човешкото описание;
2. изгражда canonical `FacadeFlowProductIntent`;
3. отделя разпознатото от unresolved стойностите;
4. задава само необходимите human clarification въпроси;
5. може да предлага известни PRELUDE кандидати, но не ги избира автоматично;
6. запазва човешките отговори като explicit clarification evidence;
7. инвалидира derived workflow state при промяна на source description.

Нито unanswered required question, нито неизвестна профилна система могат да бъдат заобиколени чрез автоматично предположение.

### REAL USER WORKFLOW V2–V6

Интегрираният milestone продължава V1 в една normal human-prompt state machine:

**V2 — Intent → Conceptual Drawing**
Създава proportional/parametric conceptual proposal. Assumptions са видими и proposal-ът изисква explicit Human Review.

**V3 — Drawing ↔ Conversation Editing**
Позволява deterministic human corrections върху candidate intent — размери, полета/отваряемост, PRELUDE profile codes, glazing, finish и handle text. Всяка приложена промяна инвалидира предишния drawing review.

**V4 — Editable Constructor Preparation**
След Human Review може изрично да се подготви editable constructor draft чрез съществуващата AI04 boundary. Това е simulation/editable handoff, не production handoff.

**V5 — Production Validation Gate**
Интегриран, но **LOCKED**. Показва липсващите authoritative engineering inputs вместо да твърди production validation.

**V6 — Manufacturing Handoff Gate**
Интегриран, но **LOCKED**. `DWG`, `DXF` и `MACHINE_JOB` са future target vocabulary, не разрешени manufacturing exports.

Normal natural-language prompt route има един canonical review flow — **V1 → V2–V6**. Legacy AI03 proposal panel остава само в отделния direct structured quick-entry route до бъдеща explicit migration фаза.

---

## AI architecture

### AI01 — Prompt Intelligence

Local deterministic prompt interpretation към canonical `FacadeFlowProductIntent`. Липсващи и нееднозначни стойности остават unresolved. Няма automatic Human Confirm, production output или machine authority.

### AI02 — Project Document Intelligence

Source-bound document evidence, candidate extraction, provenance, corroboration и conflict review към същия Product Intent. Противоречащи evidence стойности не се разрешават автоматично.

### AI03 — Parametric Construction Proposal

Изгражда conceptual parametric proposal с полета, divider/opening semantics, assumptions и unresolved technical details. `HUMAN_REVIEWED` не означава engineering approval.

### AI04 — Explicit Editable Constructor Handoff

Handoff към editable constructor geometry се допуска само след необходимия human review/acknowledgement. Profile transfer е ограничен до безопасно representable/selectable data. `rulesValidated`, `machineReady` и `productionApproved` остават false.

### AI05 — Construction / Profile Knowledge Bridge

AI05 развива construction-language, construction graph, drawing learning и canonical profile assignment/review integration. Той използва PROFILE DATA knowledge/evidence, но не превръща knowledge coverage в production authority.

---

## PROFILE DATA — current knowledge model

### PROFILE DATA V1 / PRELUDE 60 working semantics

Текущите human-confirmed base semantics включват:

| Код | Роля | Base geometry / working semantic |
| --- | --- | --- |
| `482.30` | FRAME | 64 mm работен размер / 42 mm видима ширина |
| `482.05` | WINDOW SASH | 78 mm работен размер / 56 mm видима ширина |
| `482.21` | MULLION | 84 mm работен размер / 40 mm видима ширина |

Тези стойности **не са cutting deductions и не са machine dimensions**.

Работният PRELUDE sash overlap **7 mm** е human-reviewed working value, отделен от glazing-bead geometry и изисква exact production confirmation. Не е manufacturer-authorized universal formula.

`482.26` / `482.27` остават catalogue-only door-sash entries, докато няма explicit human mapping/geometry review.

### PROFILE DATA 03 knowledge/evidence chain

PROFILE DATA 03 добавя последователна canonical knowledge линия:

- visual section library и catalogue visual truth;
- knowledge provenance;
- canonical profile identity;
- technical semantics;
- compatibility semantics;
- assembly evidence foundation;
- assembly evidence Human Review / summary / readiness;
- manual assembly evidence intake;
- evidence application;
- knowledge readiness;
- system knowledge gates;
- AI knowledge context;
- evidence request / safe-response composition;
- human clarification intake.

Ключовият принцип е:

`catalogue fact → provenance → human-reviewed semantic/evidence → readiness/knowledge gate → AI context`

а **не**:

`catalogue fact → automatic production rule`.

Manufacturer assembly compatibility, exact joint geometry, production deductions и manufacturing tolerances остават отделни бъдещи authoritative layers.

---

## Project, import and constructor foundations

FacadeFlow съдържа и вече изградените foundations за:

- project lifecycle и project/source evidence;
- guided product builder;
- Visual Composer за WINDOW/DOOR и 2/3/4-field topology;
- custom CAD-style workbench;
- local PDF/image import и human-reviewed extraction;
- local OCR-assisted evidence review;
- DWG/DXF header inspection foundation;
- read-only SkyGlazing XML/LTE inspection;
- controlled read-only DWG evaluation layer;
- conceptual 2D/3D previews;
- component-aware simulation exports.

Тези слоеве не променят production safety contract-а.

### SHAREABLE evidence alias

Чувствителният локален XML/LTE evidence corpus остава извън shareable checkpoint-а. В tracked/shareable source derived snapshot-ът е анонимизиран като `PROJECT_EVIDENCE_A`; оригиналното project/customer label, sample barcodes и private source SHA-256 fingerprints не се публикуват. Това не променя derived technical counts и не създава production authority.

---

## Verification contract

Canonical shareable verification:

```bash
npm ci
npm run verify
```

`npm run verify` изпълнява:

1. `npm run test:regression`;
2. `npm run lint`;
3. `npm run build`.

След QA02 `test:regression` автоматично открива **всички shareable**:

- `tests/*.test.ts`
- `tests/*.test.tsx`

и изключва private evidence:

- `*.internal.test.ts`
- `*.internal.test.tsx`

Това означава, че TSX Human Review/UI integration suites са част от canonical regression contract, а не отделни случайни тестове.

Controlled internal verification:

```bash
npm run verify:internal
```

добавя private internal-evidence suite и изисква съответния locked `local-samples/phase05a` evidence checkout.

За closure винаги:

```bash
git diff --check
git status --short
```

---

## Canonical checkpoints

Repository checkpoint generator-ът поддържа:

```powershell
npm run checkpoint:shareable
npm run checkpoint:internal
```

### SHAREABLE_CLEAN

- изпълнява canonical shareable verification;
- не допуска `-SkipVerify`;
- изисква clean Git working tree;
- изисква доказан `origin/<branch>...HEAD = 0 0` sync;
- изключва Git metadata, dependencies, build/runtime output, environment files и private local evidence;
- съдържа `CHECKPOINT_MANIFEST.txt` и `CHECKPOINT_CONTENT_SHA256.txt`;
- използва deterministic ZIP ordering/timestamps.

### INTERNAL_AUDIT

Може да включва private evidence само за контролирана вътрешна проверка и използва `verify:internal`.

Commit provenance трябва да се чете от manifest-а и да се проверява срещу Git, когато repository-то е налично; ZIP filename сам по себе си не е provenance proof.

---

## Safety boundaries

Следните invariants са non-negotiable:

- AUTOMATIC PROFILE SELECTION = NO
- AUTOMATIC EVIDENCE ACCEPTANCE = NO
- AUTOMATIC GEOMETRY ACCEPTANCE = NO
- EXACT PROFILE CONTOUR APPLIED = NO
- MANUFACTURER ASSEMBLY COMPATIBILITY VALIDATED = NO
- PRODUCTION DEDUCTIONS APPLIED = NO
- MANUFACTURING TOLERANCE APPLIED = NO
- RULES VALIDATED = NO
- PRODUCTION COMPATIBILITY VALIDATED = NO
- PRODUCTION UNLOCK = NO
- AUTOMATIC MANUFACTURING EXPORT = NO
- MACHINE CONNECTIVITY = NO
- MACHINE READY = NO
- PRODUCTION APPROVED = NO

`HUMAN_REVIEWED` означава human-reviewed candidate/proposal, не engineering или production approval.

Simulation JSON exports са simulation data, не machine jobs.

---

## Стартиране

Reference runtime: Node.js **22.12+** (`.nvmrc` / `.node-version`). `package.json` допуска поддържаните Node 20.19 / 22.12+ / 24 линии и npm 10/11.

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Локална packaged-style версия:

```bash
npm run local
```

Под Windows `START_FACADEFLOW_LOCAL.cmd` отваря Nadezhda-branded dedicated Edge/Chrome app window. `CREATE_FACADEFLOW_DESKTOP_SHORTCUT.cmd` създава shortcut със supplied ICO.

Допълнително: [Локално стартиране под Windows](docs/LOCAL_WINDOWS_START_BG.md).

---

## Какво следва

След QA02 closure следващата правилна техническа стъпка не е machine integration, а **production-validation knowledge foundation** върху ограничен, доказуем scope.

Практичен първи target е една PRELUDE assembly relationship (например FRAME ↔ SASH), за която постепенно да се съберат и human-validate:

1. manufacturer compatibility evidence;
2. section/joint geometry;
3. overlap/rebate semantics;
4. production deductions;
5. manufacturing tolerances;
6. deterministic validated calculation rules.

Едва след authoritative coverage V5 може постепенно да премине от `LOCKED` към конкретно валидирани случаи. V6 трябва да остане locked, докато няма отделна manufacturing/export acceptance boundary.
