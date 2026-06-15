## 1.0.1 (2026-06-15)

### 🩹 Fixes

- **mcp:** resolve the @golemui type graph in a published install ([#206](https://github.com/golemui/golemui/pull/206))

### ❤️ Thank You

- alberto-golem-ui

# 1.0.0 (2026-06-14)

### 🚀 Features

- surface form init errors instead of a silent blank form ([#184](https://github.com/golemui/golemui/pull/184))
- **mcp:** add type-checked gui.* DX authoring surface ([#185](https://github.com/golemui/golemui/pull/185))

### 🩹 Fixes

- ⚠️  Clean Public API ([#173](https://github.com/golemui/golemui/pull/173))
- reduce deps ([#180](https://github.com/golemui/golemui/pull/180))
- added license field and copied license to all publishable packages ([#189](https://github.com/golemui/golemui/pull/189))
- **gui:** repeater + display render correctness ([#183](https://github.com/golemui/golemui/pull/183))
- **gui-components:** fix next/prev month button color for default icon ([#179](https://github.com/golemui/golemui/pull/179))
- **gui-mcp:** defer DX createRequire and add portable /json export ([#193](https://github.com/golemui/golemui/pull/193))
- **gui-react:** fix gui-react:build TS4033 errors during TypeScript declaration emit ([#191](https://github.com/golemui/golemui/pull/191))
- **gui-shared:** add missing registered components ([#186](https://github.com/golemui/golemui/pull/186))
- **gui-shared:** make dx event handlers function-only ([#190](https://github.com/golemui/golemui/pull/190))
- **react:** rename useDisplayWdiget to useDisplayWidget ([#182](https://github.com/golemui/golemui/pull/182))

### ⚠️  Breaking Changes

- Clean Public API  ([#173](https://github.com/golemui/golemui/pull/173))
  Promoted dx functions, widget props and golemForm to internals API, import now from
  @golemui/gui-shared/internals

### ❤️ Thank You

- alberto-golem-ui
- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.0.0-rc.5 (2026-06-14)

### 🩹 Fixes

- **gui-mcp:** defer DX createRequire and add portable /json export ([#193](https://github.com/golemui/golemui/pull/193))
- **gui-react:** fix gui-react:build TS4033 errors during TypeScript declaration emit ([#191](https://github.com/golemui/golemui/pull/191))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.0.0-rc.4 (2026-06-14)

### 🚀 Features

- surface form init errors instead of a silent blank form ([#184](https://github.com/golemui/golemui/pull/184))
- **mcp:** add type-checked gui.* DX authoring surface ([#185](https://github.com/golemui/golemui/pull/185))

### 🩹 Fixes

- added license field and copied license to all publishable packages ([#189](https://github.com/golemui/golemui/pull/189))
- **gui-shared:** make dx event handlers function-only ([#190](https://github.com/golemui/golemui/pull/190))

### ❤️ Thank You

- alberto-golem-ui
- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.0.0-rc.3 (2026-06-13)

### 🩹 Fixes

- **gui:** repeater + display render correctness ([#183](https://github.com/golemui/golemui/pull/183))
- **gui-shared:** add missing registered components ([#186](https://github.com/golemui/golemui/pull/186))
- **react:** rename useDisplayWdiget to useDisplayWidget ([#182](https://github.com/golemui/golemui/pull/182))

### ❤️ Thank You

- alberto-golem-ui
- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.0.0-rc.2 (2026-06-10)

### 🩹 Fixes

- reduce deps ([#180](https://github.com/golemui/golemui/pull/180))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 1.0.0-rc.1 (2026-06-10)

### 🩹 Fixes

- **gui-components:** fix next/prev month button color for default icon ([#179](https://github.com/golemui/golemui/pull/179))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 1.0.0-rc.0 (2026-06-09)

### 🩹 Fixes

- ⚠️  Clean Public API ([#173](https://github.com/golemui/golemui/pull/173))

### ⚠️  Breaking Changes

- Clean Public API  ([#173](https://github.com/golemui/golemui/pull/173))
  Promoted dx functions, widget props and golemForm to internals API, import now from
  @golemui/gui-shared/internals

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 0.17.0 (2026-06-08)

### 🚀 Features

- **core:** validation-aware submit buttons ([#167](https://github.com/golemui/golemui/pull/167))
- **demos:** /demos five-pillar showcase + forms-as-data & forms-compose demos ([#149](https://github.com/golemui/golemui/pull/149))

### 🩹 Fixes

- refactor markdown input layout and fix visible scrollbars in windows ([#148](https://github.com/golemui/golemui/pull/148))
- minor UI fixes and design updates ([#168](https://github.com/golemui/golemui/pull/168))
- **core:** clear `data` after an input widget is removed ([#157](https://github.com/golemui/golemui/pull/157))
- **core:** sync touched on widgets added after VALIDATE_ALL ([#163](https://github.com/golemui/golemui/pull/163))
- **core:** action label should be optional ([#164](https://github.com/golemui/golemui/pull/164))
- **core:** form-widget fixes ([#165](https://github.com/golemui/golemui/pull/165))
- **gui-components:** Fix right spacing to markdown textarea ([#158](https://github.com/golemui/golemui/pull/158))
- **gui-react:** make the React adapter work on React 18 ([#154](https://github.com/golemui/golemui/pull/154))
- **mcp:** fill documentation gaps and deduplicate get_concept/get_widget_spec tools ([#153](https://github.com/golemui/golemui/pull/153))

### ❤️ Thank You

- alberto-golem-ui
- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 0.16.2 (2026-05-30)

### 🩹 Fixes

- **mcp:** add missing rollup-generated chunk files ([#147](https://github.com/golemui/golemui/pull/147))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 0.16.1 (2026-05-30)

### 🚀 Features

- **mcp:** expose tool functions as an importable library alongside the CLI ([#146](https://github.com/golemui/golemui/pull/146))

### ❤️ Thank You

- Mud Scientist

## 0.16.0 (2026-05-30)

### 🚀 Features

- **core:** improved string interpolation with full expression support ([#143](https://github.com/golemui/golemui/pull/143))
- **mcp:** add get_concept tool and fix reactive-expression lint ([#138](https://github.com/golemui/golemui/pull/138))

### 🩹 Fixes

- light mode ([#137](https://github.com/golemui/golemui/pull/137))
- **schemas:** clean up and enrich JSON schema definitions ([#145](https://github.com/golemui/golemui/pull/145))
- **shared:** add markdown text shortcut ([#142](https://github.com/golemui/golemui/pull/142))

### ❤️ Thank You

- mudscientist
- Raúl Jiménez @Elecash

## 0.15.1 (2026-05-27)

### 🩹 Fixes

- **angular:** add signals interface for angular item renderers ([#135](https://github.com/golemui/golemui/pull/135))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 0.15.0 (2026-05-26)

### 🚀 Features

- add tags widget ([#121](https://github.com/golemui/golemui/pull/121))
- add mcp server ([#127](https://github.com/golemui/golemui/pull/127))
- create the new gui-schemas project ([#131](https://github.com/golemui/golemui/pull/131))
- add schemas lib ([#133](https://github.com/golemui/golemui/pull/133))
- **core:** add actionType: 'submit' to action widgets ([#120](https://github.com/golemui/golemui/pull/120))

### 🩹 Fixes

- release from 0.0.0 ([#134](https://github.com/golemui/golemui/pull/134))
- **angular:** add support for input signals to angular item renderers ([#130](https://github.com/golemui/golemui/pull/130))
- **pills:** fix pills component issues in compact mode ([#126](https://github.com/golemui/golemui/pull/126))

### ❤️ Thank You

- Mud Scientist
- mudscientist
- Raul Jimenez @Elecash
- Raúl Jiménez @Elecash

## 0.14.0 (2026-05-21)

### 🚀 Features

- add Vue support ([#97](https://github.com/golemui/golemui/pull/97))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 0.13.3 (2026-05-19)

### 🩹 Fixes

- first install issues ([#108](https://github.com/golemui/golemui/pull/108))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 0.13.2 (2026-05-19)

### 🩹 Fixes

- add missing files to npm packages ([#107](https://github.com/golemui/golemui/pull/107))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 0.13.1 (2026-05-18)

### 🩹 Fixes

- dx layer custom validators ([#95](https://github.com/golemui/golemui/pull/95))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 0.13.0 (2026-05-18)

### 🚀 Features

- make web components tree-shakable ([#94](https://github.com/golemui/golemui/pull/94))
- **core,gui-shared:** introduce /internals subpath ([#90](https://github.com/golemui/golemui/pull/90))

### ❤️ Thank You

- mudscientist
- Raúl Jiménez @Elecash

## 0.12.2 (2026-05-16)

### 🩹 Fixes

- **schemas:** move archiveSchemas above releaseChangelog ([#89](https://github.com/golemui/golemui/pull/89))

### ❤️ Thank You

- mudscientist

## 0.12.1 (2026-05-16)

### 🩹 Fixes

- **schemas:** fix json schema deployment when releasing ([#87](https://github.com/golemui/golemui/pull/87))
- **schemas:** fix json schema deployment when releasing - pt.2 ([#88](https://github.com/golemui/golemui/pull/88))

### ❤️ Thank You

- mudscientist

## 0.12.0 (2026-05-16)

### 🚀 Features

- align package versions after npm publis ([#85](https://github.com/golemui/golemui/pull/85))
- reset release history for new versioning sequence ([#86](https://github.com/golemui/golemui/pull/86))

### ❤️ Thank You

- Raúl Jiménez @Elecash