# Export Standards & Public API Migration Plan

## Why

The public API has grown without a deliberate export strategy. `export *` at multiple
levels means any internal symbol can accidentally become part of the public surface.
At v0.1.0 this is the right moment to fix it before the API stabilises.

---

## Conventions

### Export style (all library source files)

- No `export *` at any `src/index.ts` — explicit named re-exports only.
- Same rule applies to all intermediate barrel files inside `src/lib/`.
- `export type { }` for every type-only export — no value/type mixed exports.
- The `_` prefix (e.g. `_guiTextInput`, `_gslInputs`) marks **public** lower-level
  primitives for advanced users and extension authors. It does not mean private.

**Reference:** `libs/gui/shared/src/lib/dx/index.ts` is the template for this style.
Every other barrel in the repo should follow it.

### Import style (end-user convention — document this in the README)

```ts
// Primary API — namespace object
import { gui } from '@golemui/gui-shared';

// Types — always import type
import type { FormInput, GuiFormInitConfig } from '@golemui/gui-shared';

// Framework component
import { GuiForm } from '@golemui/gui-react';
```

`import * as Pkg from '@golemui/...'` is allowed in app/playground code but is not
the documented consumer pattern.

### Import style (source files — libraries and apps)

Avoid `import * as Name from '...'` anywhere in the codebase — prefer named imports:

```ts
// Bad
import * as Widget from '../form-widget';
type Foo = Widget.FormWidget;

// Good
import { type FormWidget } from '../form-widget';
type Foo = FormWidget;
```

Namespace imports bypass tree-shaking and make it opaque what is actually consumed.
The only permitted exception is a third-party package with no named-export surface
(verify before keeping).

### Cross-library internals

Symbols needed by sibling packages but not by end-users go in a `/internals` subpath:

```ts
// Inside a sibling lib (e.g. @golemui/gui-react):
import { something } from '@golemui/core/internals';

// End-users must never import from /internals.
```

Enforce with:

1. `package.json` conditional exports map (the `/internals` entry only exists for known
   importers).
2. `@internal` TSDoc annotation on each symbol (IDEs will not surface them).
3. Nx `@nx/enforce-module-boundaries` rule preventing `type:app` from importing
   any `/internals` path (see PR 8).

---

## Current State (audited 2026-05-16)

### Entry points using `export *` (needs PR 4–6)

| File                               | `export *` lines |
| ---------------------------------- | ---------------- |
| `libs/core/src/index.ts`           | 23               |
| `libs/gui/shared/src/index.ts`     | 7                |
| `libs/react/src/index.ts`          | 4                |
| `libs/lit/src/index.ts`            | 15               |
| `libs/gui/react/src/index.ts`      | 4                |
| `libs/gui/lit/src/index.ts`        | 2                |
| `libs/gui/components/src/index.ts` | 5                |

`libs/gui/angular/src/index.ts` and `libs/gui/shared/src/lib/dx/index.ts` are
already explicit — they are the template.

### Intermediate barrel files to standardise (PR 7)

21 files under `src/lib/` — key ones:

- `libs/react/src/lib/utils/index.ts`
- `libs/react/src/lib/hooks/index.ts`
- `libs/core/src/lib/middleware/index.ts`
- `libs/core/src/lib/context/index.ts`
- `libs/core/src/lib/store/reducers/index.ts`
- `libs/angular/src/lib/adapters/index.ts`
- `libs/gui/components/src/lib/components/index.ts`
- `libs/gui/components/src/lib/controllers/index.ts`
- `libs/gui/shared/src/lib/utils/index.ts`

### Nx tags (PR 8)

All `project.json` files have `"tags": []` — clean slate, no constraints yet.

### ESLint boundary rule (PR 8)

`eslint.config.mjs` has `@nx/enforce-module-boundaries` configured but with
permissive wildcard constraints (`* → *`). Real tag-based constraints need to be added.

### `/internals` subpath

Not in use anywhere. No `@golemui/*/subpath` imports exist. Clean slate.

---

## Migration PRs

All PRs are self-contained and independently releasable.

---

### PR 1 — Introduce `/internals` subpath

**Goal:** Additive infrastructure for cross-library symbols that must not be
end-user-facing.

**Steps:**

1. Audit `@golemui/core` and `@golemui/gui-shared` for symbols consumed by sibling
   packages (`@golemui/gui-react`, `@golemui/gui-lit`, `@golemui/gui-angular`,
   `@golemui/react`, `@golemui/lit`) but not needed by end-users.
2. Create `src/internals.ts` in each affected package (alongside `src/index.ts`).
3. Add `./internals` entry to `package.json` exports:
   ```json
   "./internals": {
     "types": "./internals.d.ts",
     "import": "./internals.js"
   }
   ```
4. Update `vite.config.ts` to add a second entry point (`entry: { index: '...', internals: '...' }`).
5. Update sibling library import paths to `@golemui/core/internals`.
6. Add `@internal` TSDoc to each symbol moved to `internals.ts`.

**Packages affected:** `@golemui/core`, `@golemui/gui-shared`
**Breaking:** No — purely additive.

---

### PR 2 — Enforce `export type` everywhere

**Goal:** All type-only exports use `export type { }`.

**Steps:**

1. Grep for `export \{` in all `src/index.ts` and barrel files.
2. For each, check if the exported name is a type or interface.
3. Replace bare `export { TypeName }` with `export type { TypeName }`.
4. Consider adding `"verbatimModuleSyntax": true` to the shared `tsconfig.base.json`
   to make the compiler enforce this permanently.

**Breaking:** No — compile-time correctness only.

---

### ~~PR 3 — Eliminate namespace imports~~ ✅ Done (2026-05-18)

**Goal:** Replace all `import * as Name from '...'` in library source files with
explicit named imports.

**Why:** Namespace imports bypass tree-shaking, make it opaque what is actually
consumed, and are inconsistent with the explicit-is-better convention the rest of
this plan enforces.

**Steps:**

1. Grep for `import \* as` across `libs/`, `apps/`, `demos/`, and `tools/`.
2. For each occurrence, identify which properties of `Name` are actually used.
3. Replace with `import { symbol1, symbol2 } from '...'`, applying `type` as needed
   per PR 2 rules (e.g. `import { type FormWidget, isLayoutWidget } from '...'`).
4. After the migration, enable `import/no-namespace` from `eslint-plugin-import` to
   prevent regressions.
5. Exception: a third-party package with no named-export surface may keep its
   namespace import — verify first before keeping.

**Files affected:** All source files containing `import * as` across the entire repo.
**Breaking:** No — pure refactor, no public API changes.

---

### PR 4 — Explicit exports: `@golemui/core`

**Goal:** Replace `export *` in `libs/core/src/index.ts` with deliberate named exports.

**File:** `libs/core/src/index.ts` (23 wildcard re-exports today)

**Steps:**

1. For each `export * from './lib/X'` line, open the target file and list its exports.
2. Decide: public (goes in `src/index.ts`) or internal (goes in `src/internals.ts`, PR 1).
3. Replace each wildcard line with explicit `export { ... }` / `export type { ... }`.

**Breaking:** Possibly — may intentionally remove accidentally-public symbols. At v0.x
this is acceptable.

---

### PR 5 — Explicit exports: `@golemui/gui-shared`

**Goal:** Replace `export *` in `libs/gui/shared/src/index.ts`.

**File:** `libs/gui/shared/src/index.ts` (7 wildcard re-exports today)

**Template:** `libs/gui/shared/src/lib/dx/index.ts` already does this correctly.

**Steps:**

1. Sub-modules to audit: `golem-form`, `shared`, `utils`, `widget.factory`,
   `widget.props`, `widgets`.
2. For each: list exports, classify as public or internal, write explicit re-exports.
3. The `export * from './lib/dx'` line should become explicit re-exports of only the
   symbols already listed in `dx/index.ts`.

**Breaking:** Possibly — same rationale as PR 4.

---

### PR 6 — Explicit exports: framework adapters

**Goal:** Replace `export *` in all remaining framework library entry points.

**Files:**

- `libs/react/src/index.ts`
- `libs/lit/src/index.ts`
- `libs/angular/src/index.ts` (mostly explicit already, verify)
- `libs/gui/react/src/index.ts`
- `libs/gui/lit/src/index.ts`
- `libs/gui/components/src/index.ts`
- `libs/gui/validators/src/index.ts`

**Breaking:** Possibly — same rationale as PR 4.

---

### PR 7 — Standardise intermediate barrel files

**Goal:** All `src/lib/**/index.ts` files use explicit named re-exports.

This is internal restructuring — it does not affect the public API if the `src/index.ts`
entry points are already explicit after PRs 4–6.

**Files to update:** The 21 files listed in the Current State section above.

**Breaking:** No — pure internal reorganisation.

---

### PR 8 — Nx tags and module boundary enforcement

**Goal:** Lint-enforce the `/internals` contract and cross-package dependency rules.

**Steps:**

1. Add `tags` to every `project.json`. Proposed taxonomy:
   - `type:lib` or `type:app`
   - `scope:core` — `@golemui/core`, `@golemui/gui-validators`
   - `scope:gui` — `@golemui/gui-shared`, `@golemui/gui-components`
   - `scope:framework` — `@golemui/react`, `@golemui/lit`, `@golemui/angular`,
     `@golemui/gui-react`, `@golemui/gui-lit`, `@golemui/gui-angular`
   - `scope:app` — everything under `apps/`

2. Update `depConstraints` in `eslint.config.mjs`:
   ```js
   depConstraints: [
     // Apps cannot import /internals
     {
       sourceTag: 'type:app',
       bannedExternalImports: ['@golemui/*/internals'],
     },
     // Dependency direction: app → framework → gui → core
     { sourceTag: 'scope:gui', onlyDependOnLibsWithTags: ['scope:core'] },
     {
       sourceTag: 'scope:framework',
       onlyDependOnLibsWithTags: ['scope:core', 'scope:gui', 'scope:framework'],
     },
     {
       sourceTag: 'scope:app',
       onlyDependOnLibsWithTags: ['scope:core', 'scope:gui', 'scope:framework', 'scope:app'],
     },
   ];
   ```

**Breaking:** No — lint-only.

---

### PR 9 — Documentation

**Goal:** Surface conventions in the README and CONTRIBUTING so contributors know the
rules.

**Steps:**

- Add "Importing GolemUI" section to `README.md` with the examples from the Conventions
  section above.
- Add "Export conventions" section to `CONTRIBUTING.md` (create if absent).
- Document the `_` prefix meaning and the `/internals` contract.

**Breaking:** No.

---

## Summary

| PR  | Change                                   | Breaking? | Effort |
| --- | ---------------------------------------- | --------- | ------ |
| 1   | `/internals` subpath + `@internal` TSDoc | No        | Medium |
| 2   | `export type` enforcement                | No        | Low    |
| 3   | Eliminate namespace imports in libs      | No        | Low    |
| 4   | Core explicit exports                    | Possibly  | Medium |
| 5   | gui-shared explicit exports              | Possibly  | Medium |
| 6   | Framework adapters explicit exports      | Possibly  | Medium |
| 7   | Intermediate barrel standardisation      | No        | Low    |
| 8   | Nx tags + module boundary rules          | No        | Low    |
| 9   | Documentation                            | No        | Low    |
