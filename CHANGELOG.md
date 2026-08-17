## 1.3.0 (2026-08-16)

### 🚀 Features

- **schemas:** layer the published JSON schemas into a core and a gui tree ([#281](https://github.com/golemui/golemui/pull/281))

### 🩹 Fixes

- **gui-components:** show errors inside pickers ([#282](https://github.com/golemui/golemui/pull/282))
- **schemas:** implementation-neutral size wording and init starter-example note ([#283](https://github.com/golemui/golemui/pull/283))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.3.0-rc.0 (2026-08-14)

### 🚀 Features

- **schemas:** layer the published JSON schemas into a core and a gui tree ([#281](https://github.com/golemui/golemui/pull/281))

### 🩹 Fixes

- **gui-components:** show errors inside pickers ([#282](https://github.com/golemui/golemui/pull/282))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.2.1 (2026-08-11)

### 🩹 Fixes

- date time intermediate states and commit on blur ([#265](https://github.com/golemui/golemui/pull/265))
- avoid double registration warnings via shared safeDefine ([#278](https://github.com/golemui/golemui/pull/278))
- **core:** inputs added after form interaction no longer show errors before being touched ([#263](https://github.com/golemui/golemui/pull/263))
- **gui-components:** mark rollup chunks as side-effectful ([#261](https://github.com/golemui/golemui/pull/261))
- **gui-components:** fix dropdown caret arrow position ([#264](https://github.com/golemui/golemui/pull/264))
- **gui-components:** Set default min year to 1900 instead of 1000 ([#277](https://github.com/golemui/golemui/pull/277))
- **gui-components:** avoid auto-advance input part when date/time is completed ([#279](https://github.com/golemui/golemui/pull/279))
- **gui-components:** consistent arrow key navigation in widgets with pills ([#280](https://github.com/golemui/golemui/pull/280))
- **gui-mcp:** warn on half-configured boolean validators; document validation traps ([#262](https://github.com/golemui/golemui/pull/262))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.2.1-rc.0 (2026-08-11)

### 🩹 Fixes

- date time intermediate states and commit on blur ([#265](https://github.com/golemui/golemui/pull/265))
- avoid double registration warnings via shared safeDefine ([#278](https://github.com/golemui/golemui/pull/278))
- **core:** inputs added after form interaction no longer show errors before being touched ([#263](https://github.com/golemui/golemui/pull/263))
- **gui-components:** mark rollup chunks as side-effectful ([#261](https://github.com/golemui/golemui/pull/261))
- **gui-components:** fix dropdown caret arrow position ([#264](https://github.com/golemui/golemui/pull/264))
- **gui-components:** Set default min year to 1900 instead of 1000 ([#277](https://github.com/golemui/golemui/pull/277))
- **gui-components:** avoid auto-advance input part when date/time is completed ([#279](https://github.com/golemui/golemui/pull/279))
- **gui-components:** consistent arrow key navigation in widgets with pills ([#280](https://github.com/golemui/golemui/pull/280))
- **gui-mcp:** warn on half-configured boolean validators; document validation traps ([#262](https://github.com/golemui/golemui/pull/262))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.2.0 (2026-08-04)

### 🚀 Features

- **angular:** add provideWidgetSet and a generic widget set form component ([bd40f494](https://github.com/golemui/golemui/commit/bd40f494))
- **dx:** add @golemui/dx, the form authoring pipeline independent of widget-set ([0ee37028](https://github.com/golemui/golemui/commit/0ee37028))
- **dx:** add createSelectors and createImplementation factories ([994c68eb](https://github.com/golemui/golemui/commit/994c68eb))
- **dx:** add the widget set form config merge helper ([7b0c0d48](https://github.com/golemui/golemui/commit/7b0c0d48))
- **lit:** add createFormComponent for building a form element class from a widget set ([b3f0a13c](https://github.com/golemui/golemui/commit/b3f0a13c))
- **mcp:** add golemui-mcp CLI subcommands for skills ([58b9c21f](https://github.com/golemui/golemui/commit/58b9c21f))
- **react:** add createFormComponent for building a form component from a widget set ([0be35258](https://github.com/golemui/golemui/commit/0be35258))
- **vue:** add createFormComponent for building a form component from a widget set ([76f56a3d](https://github.com/golemui/golemui/commit/76f56a3d))

### 🩹 Fixes

- allow inject validations from event handlers ([#231](https://github.com/golemui/golemui/pull/231))
- make tabpanels focusable and drop redundant tabindex on native buttons ([fa08ed35](https://github.com/golemui/golemui/commit/fa08ed35))
- dependencies and type graph ([#241](https://github.com/golemui/golemui/pull/241))
- **angular:** remove unused aria directive ([68c07899](https://github.com/golemui/golemui/commit/68c07899))
- **components:** expose aria-required and fix required attribute binding ([3c347517](https://github.com/golemui/golemui/commit/3c347517))
- **components:** announce validation errors via live region ([f4355a39](https://github.com/golemui/golemui/commit/f4355a39))
- **components:** split aria-disabled from aria-readonly ([a562b218](https://github.com/golemui/golemui/commit/a562b218))
- **components:** expose toggle ARIA on the real control ([5f840269](https://github.com/golemui/golemui/commit/5f840269))
- **components:** hide decorative icons from assistive technology ([84b3afb1](https://github.com/golemui/golemui/commit/84b3afb1))
- **components:** expose segment aria-label props for date/time parts ([3e80ef30](https://github.com/golemui/golemui/commit/3e80ef30))
- **components:** accessible date/time pickers ([7e13a999](https://github.com/golemui/golemui/commit/7e13a999))
- **components:** move aria to host in list component ([b1a6b368](https://github.com/golemui/golemui/commit/b1a6b368))
- **components:** improve list focus styling ([e459856c](https://github.com/golemui/golemui/commit/e459856c))
- **components:** announce calendar month changes and label the year selector ([eca6ad26](https://github.com/golemui/golemui/commit/eca6ad26))
- **components:** update json schemas to accept the aria-label props ([f34ee9b8](https://github.com/golemui/golemui/commit/f34ee9b8))
- **components:** avoid duplicate widget id while a picker popup is open ([a27e7ef7](https://github.com/golemui/golemui/commit/a27e7ef7))
- **components:** announce full day names and keep blocked days in the accessibility tree ([32c99d2f](https://github.com/golemui/golemui/commit/32c99d2f))
- **components:** focusable, named password visibility toggle ([f87de7e2](https://github.com/golemui/golemui/commit/f87de7e2))
- **components:** add aria attributes to number, currency, radiogroup and labels ([dd93f816](https://github.com/golemui/golemui/commit/dd93f816))
- **components:** expose pills as a toolbar of real buttons ([52641f23](https://github.com/golemui/golemui/commit/52641f23))
- **components:** keep picker popovers open on interior non-focusable clicks ([8f136865](https://github.com/golemui/golemui/commit/8f136865))
- **components:** use role toolbar in markdown editor and pass missing titles ([88488312](https://github.com/golemui/golemui/commit/88488312))
- **core:** make WithWidget and WidgetLoaders public-only ([#228](https://github.com/golemui/golemui/pull/228))
- **core:** deterministic uids for widgets ([#229](https://github.com/golemui/golemui/pull/229))
- **dx:** update registration error messages for the pure-definition model ([493f51fd](https://github.com/golemui/golemui/commit/493f51fd))
- **dx:** pass the dependency shape as a type parameter ([384464ed](https://github.com/golemui/golemui/commit/384464ed))
- **gui-components:** fix required star position ([#257](https://github.com/golemui/golemui/pull/257))
- **gui-mcp:** resolve @golemui/dx in the dx_check_code type graph ([8afa41db](https://github.com/golemui/golemui/commit/8afa41db))
- **gui-shared:** restore the gui dependency typing on the DX types ([6068097d](https://github.com/golemui/golemui/commit/6068097d))
- **gui-validators:** make initValidators fail loudly on unknown configs ([#237](https://github.com/golemui/golemui/pull/237))
- **gui-validators:** fail loudly on unknown custom rules and string formats ([024b41db](https://github.com/golemui/golemui/commit/024b41db))
- **mcp:** correct lit and vanilla submit event names in DX grounding ([47cf777f](https://github.com/golemui/golemui/commit/47cf777f))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash
- Raúl Jiménez @Elecash

## 1.1.1-rc.3 (2026-08-04)

### 🚀 Features

- **angular:** add provideWidgetSet and a generic widget set form component ([bd40f494](https://github.com/golemui/golemui/commit/bd40f494))
- **dx:** add the widget set form config merge helper ([7b0c0d48](https://github.com/golemui/golemui/commit/7b0c0d48))
- **lit:** add createFormComponent for building a form element class from a widget set ([b3f0a13c](https://github.com/golemui/golemui/commit/b3f0a13c))
- **react:** add createFormComponent for building a form component from a widget set ([0be35258](https://github.com/golemui/golemui/commit/0be35258))
- **vue:** add createFormComponent for building a form component from a widget set ([76f56a3d](https://github.com/golemui/golemui/commit/76f56a3d))

### 🩹 Fixes

- **gui-components:** fix required star position ([#257](https://github.com/golemui/golemui/pull/257))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.1.1-rc.2 (2026-08-03)

### 🚀 Features

- **dx:** add createSelectors and createImplementation factories ([994c68eb](https://github.com/golemui/golemui/commit/994c68eb))

### 🩹 Fixes

- dependencies and type graph ([#241](https://github.com/golemui/golemui/pull/241))
- **dx:** update registration error messages for the pure-definition model ([493f51fd](https://github.com/golemui/golemui/commit/493f51fd))
- **dx:** pass the dependency shape as a type parameter ([384464ed](https://github.com/golemui/golemui/commit/384464ed))
- **gui-shared:** restore the gui dependency typing on the DX types ([6068097d](https://github.com/golemui/golemui/commit/6068097d))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.1.1-rc.1 (2026-08-02)

### 🚀 Features

- **dx:** add @golemui/dx, the form authoring pipeline independent of widget-set ([0ee37028](https://github.com/golemui/golemui/commit/0ee37028))

### 🩹 Fixes

- **gui-mcp:** resolve @golemui/dx in the dx_check_code type graph ([8afa41db](https://github.com/golemui/golemui/commit/8afa41db))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.1.1-rc.0 (2026-08-01)

### 🚀 Features

- **mcp:** add golemui-mcp CLI subcommands for skills ([58b9c21f](https://github.com/golemui/golemui/commit/58b9c21f))

### 🩹 Fixes

- allow inject validations from event handlers ([#231](https://github.com/golemui/golemui/pull/231))
- make tabpanels focusable and drop redundant tabindex on native buttons ([fa08ed35](https://github.com/golemui/golemui/commit/fa08ed35))
- **angular:** remove unused aria directive ([68c07899](https://github.com/golemui/golemui/commit/68c07899))
- **components:** expose aria-required and fix required attribute binding ([3c347517](https://github.com/golemui/golemui/commit/3c347517))
- **components:** announce validation errors via live region ([f4355a39](https://github.com/golemui/golemui/commit/f4355a39))
- **components:** split aria-disabled from aria-readonly ([a562b218](https://github.com/golemui/golemui/commit/a562b218))
- **components:** expose toggle ARIA on the real control ([5f840269](https://github.com/golemui/golemui/commit/5f840269))
- **components:** hide decorative icons from assistive technology ([84b3afb1](https://github.com/golemui/golemui/commit/84b3afb1))
- **components:** expose segment aria-label props for date/time parts ([3e80ef30](https://github.com/golemui/golemui/commit/3e80ef30))
- **components:** accessible date/time pickers ([7e13a999](https://github.com/golemui/golemui/commit/7e13a999))
- **components:** move aria to host in list component ([b1a6b368](https://github.com/golemui/golemui/commit/b1a6b368))
- **components:** improve list focus styling ([e459856c](https://github.com/golemui/golemui/commit/e459856c))
- **components:** announce calendar month changes and label the year selector ([eca6ad26](https://github.com/golemui/golemui/commit/eca6ad26))
- **components:** update json schemas to accept the aria-label props ([f34ee9b8](https://github.com/golemui/golemui/commit/f34ee9b8))
- **components:** avoid duplicate widget id while a picker popup is open ([a27e7ef7](https://github.com/golemui/golemui/commit/a27e7ef7))
- **components:** announce full day names and keep blocked days in the accessibility tree ([32c99d2f](https://github.com/golemui/golemui/commit/32c99d2f))
- **components:** focusable, named password visibility toggle ([f87de7e2](https://github.com/golemui/golemui/commit/f87de7e2))
- **components:** add aria attributes to number, currency, radiogroup and labels ([dd93f816](https://github.com/golemui/golemui/commit/dd93f816))
- **components:** expose pills as a toolbar of real buttons ([52641f23](https://github.com/golemui/golemui/commit/52641f23))
- **components:** keep picker popovers open on interior non-focusable clicks ([8f136865](https://github.com/golemui/golemui/commit/8f136865))
- **components:** use role toolbar in markdown editor and pass missing titles ([88488312](https://github.com/golemui/golemui/commit/88488312))
- **core:** make WithWidget and WidgetLoaders public-only ([#228](https://github.com/golemui/golemui/pull/228))
- **core:** deterministic uids for widgets ([#229](https://github.com/golemui/golemui/pull/229))
- **gui-validators:** make initValidators fail loudly on unknown configs ([#237](https://github.com/golemui/golemui/pull/237))
- **gui-validators:** fail loudly on unknown custom rules and string formats ([024b41db](https://github.com/golemui/golemui/commit/024b41db))
- **mcp:** correct lit and vanilla submit event names in DX grounding ([47cf777f](https://github.com/golemui/golemui/commit/47cf777f))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash
- Raúl Jiménez @Elecash

## 1.1.0 (2026-07-21)

### 🚀 Features

- add time input ([#217](https://github.com/golemui/golemui/pull/217))
- add date time input ([#218](https://github.com/golemui/golemui/pull/218))
- add time and date-time inputs and input error localizable messages ([#220](https://github.com/golemui/golemui/pull/220))
- add $item / $index scope to repeater templates ([#222](https://github.com/golemui/golemui/pull/222))
- range time and range date time inputs ([#225](https://github.com/golemui/golemui/pull/225))
- `$fn` host functions for reactive expressions ([#227](https://github.com/golemui/golemui/pull/227))

### 🩹 Fixes

- **gui-components:** Fix select widget height ([#223](https://github.com/golemui/golemui/pull/223))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.0.3 (2026-07-02)

### 🩹 Fixes

- date picker responsive styles ([#214](https://github.com/golemui/golemui/pull/214))
- runtime functions were failing on init ([#216](https://github.com/golemui/golemui/pull/216))
- firefox issues with date inputs, numeric inputs and dropdown ([#215](https://github.com/golemui/golemui/pull/215))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.0.2 (2026-06-26)

### 🩹 Fixes

- Update textarea value on set programmatically ([#211](https://github.com/golemui/golemui/pull/211))
- **gui-components:** styling issues ([#212](https://github.com/golemui/golemui/pull/212))
- **schemas:** add custom widget fallback to the JSON form schema ([#208](https://github.com/golemui/golemui/pull/208))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

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