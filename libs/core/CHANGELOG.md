## 1.5.0-rc.0 (2026-09-04)

### 🚀 Features

- **core:** add widget preloading for synchronous component access ([#330](https://github.com/golemui/golemui/pull/330))

### 🩹 Fixes

- **core:** deterministic function widget uids and default language ([#329](https://github.com/golemui/golemui/pull/329))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.4.0 (2026-08-26)

### 🚀 Features

- **core:** remove the no-op mount actions and the blur-time function widget re-resolve ([#303](https://github.com/golemui/golemui/pull/303))
- **core:** add WidgetViewModel and the rows templateData field ([#294](https://github.com/golemui/golemui/pull/294))
- **core:** compute the widget set from data on every action ([#290](https://github.com/golemui/golemui/pull/290))

### 🩹 Fixes

- **core:** copy a function widget result before writing uid and path ([#311](https://github.com/golemui/golemui/pull/311))
- **core:** find override targets in resolvedSources so hidden widgets are reachable ([#313](https://github.com/golemui/golemui/pull/313))
- **core:** omit repeater rows an errored derive never resolved ([#312](https://github.com/golemui/golemui/pull/312))
- **core:** discard the whole derive when one of its passes fails ([#309](https://github.com/golemui/golemui/pull/309))
- **core:** find function widget controls by the path they own ([#308](https://github.com/golemui/golemui/pull/308))
- **core:** copy data containers on write instead of mutating the previous state ([#305](https://github.com/golemui/golemui/pull/305))
- **core:** exclude the widgets inside a hidden layout from validation, touch and submit data ([#304](https://github.com/golemui/golemui/pull/304))

### 🔥 Performance

- **core:** cache compiled expressions by their source string ([437ee072](https://github.com/golemui/golemui/commit/437ee072))
- **core:** compute isFormValid once per validation action ([d831e98c](https://github.com/golemui/golemui/commit/d831e98c))
- **core:** check flag fields before resolving widgets in the flags pass ([95e8c029](https://github.com/golemui/golemui/commit/95e8c029))
- **core:** skip the row widget copy when it has no when expression ([af259461](https://github.com/golemui/golemui/commit/af259461))
- **core:** reuse widget references when a recompute produces equal content ([#289](https://github.com/golemui/golemui/pull/289))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.4.0-rc.0 (2026-08-26)

### 🚀 Features

- **core:** remove the no-op mount actions and the blur-time function widget re-resolve ([#303](https://github.com/golemui/golemui/pull/303))
- **core:** add WidgetViewModel and the rows templateData field ([#294](https://github.com/golemui/golemui/pull/294))
- **core:** compute the widget set from data on every action ([#290](https://github.com/golemui/golemui/pull/290))

### 🩹 Fixes

- **core:** copy a function widget result before writing uid and path ([#311](https://github.com/golemui/golemui/pull/311))
- **core:** find override targets in resolvedSources so hidden widgets are reachable ([#313](https://github.com/golemui/golemui/pull/313))
- **core:** omit repeater rows an errored derive never resolved ([#312](https://github.com/golemui/golemui/pull/312))
- **core:** discard the whole derive when one of its passes fails ([#309](https://github.com/golemui/golemui/pull/309))
- **core:** find function widget controls by the path they own ([#308](https://github.com/golemui/golemui/pull/308))
- **core:** copy data containers on write instead of mutating the previous state ([#305](https://github.com/golemui/golemui/pull/305))
- **core:** exclude the widgets inside a hidden layout from validation, touch and submit data ([#304](https://github.com/golemui/golemui/pull/304))

### 🔥 Performance

- **core:** cache compiled expressions by their source string ([437ee072](https://github.com/golemui/golemui/commit/437ee072))
- **core:** compute isFormValid once per validation action ([d831e98c](https://github.com/golemui/golemui/commit/d831e98c))
- **core:** check flag fields before resolving widgets in the flags pass ([95e8c029](https://github.com/golemui/golemui/commit/95e8c029))
- **core:** skip the row widget copy when it has no when expression ([af259461](https://github.com/golemui/golemui/commit/af259461))
- **core:** reuse widget references when a recompute produces equal content ([#289](https://github.com/golemui/golemui/pull/289))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.3.0 (2026-08-16)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.3.0-rc.0 (2026-08-14)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.2.1 (2026-08-11)

### 🩹 Fixes

- date time intermediate states and commit on blur ([#265](https://github.com/golemui/golemui/pull/265))
- **core:** inputs added after form interaction no longer show errors before being touched ([#263](https://github.com/golemui/golemui/pull/263))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.2.1-rc.0 (2026-08-11)

### 🩹 Fixes

- date time intermediate states and commit on blur ([#265](https://github.com/golemui/golemui/pull/265))
- **core:** inputs added after form interaction no longer show errors before being touched ([#263](https://github.com/golemui/golemui/pull/263))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.2.0 (2026-08-04)

### 🩹 Fixes

- **mcp:** correct lit and vanilla submit event names in DX grounding ([47cf777f](https://github.com/golemui/golemui/commit/47cf777f))
- **core:** deterministic uids for widgets ([#229](https://github.com/golemui/golemui/pull/229))
- **core:** make WithWidget and WidgetLoaders public-only ([#228](https://github.com/golemui/golemui/pull/228))
- allow inject validations from event handlers ([#231](https://github.com/golemui/golemui/pull/231))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash
- Raúl Jiménez @Elecash

## 1.1.1-rc.3 (2026-08-04)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.1.1-rc.2 (2026-08-03)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.1.1-rc.1 (2026-08-02)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.1.1-rc.0 (2026-08-01)

### 🩹 Fixes

- **mcp:** correct lit and vanilla submit event names in DX grounding ([47cf777f](https://github.com/golemui/golemui/commit/47cf777f))
- **core:** deterministic uids for widgets ([#229](https://github.com/golemui/golemui/pull/229))
- **core:** make WithWidget and WidgetLoaders public-only ([#228](https://github.com/golemui/golemui/pull/228))
- allow inject validations from event handlers ([#231](https://github.com/golemui/golemui/pull/231))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash
- Raúl Jiménez @Elecash

## 1.1.0 (2026-07-21)

### 🚀 Features

- `$fn` host functions for reactive expressions ([#227](https://github.com/golemui/golemui/pull/227))
- add $item / $index scope to repeater templates ([#222](https://github.com/golemui/golemui/pull/222))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.0.3 (2026-07-02)

### 🩹 Fixes

- runtime functions were failing on init ([#216](https://github.com/golemui/golemui/pull/216))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 1.0.2 (2026-06-26)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.0.1 (2026-06-15)

This was a version bump only for core to align it with other projects, there were no code changes.

# 1.0.0 (2026-06-14)

### 🚀 Features

- surface form init errors instead of a silent blank form ([#184](https://github.com/golemui/golemui/pull/184))

### 🩹 Fixes

- added license field and copied license to all publishable packages ([#189](https://github.com/golemui/golemui/pull/189))

### ❤️ Thank You

- alberto-golem-ui
- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.0.0-rc.5 (2026-06-14)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.0.0-rc.4 (2026-06-14)

### 🚀 Features

- surface form init errors instead of a silent blank form ([#184](https://github.com/golemui/golemui/pull/184))

### 🩹 Fixes

- added license field and copied license to all publishable packages ([#189](https://github.com/golemui/golemui/pull/189))

### ❤️ Thank You

- alberto-golem-ui
- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.0.0-rc.3 (2026-06-13)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.0.0-rc.2 (2026-06-10)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.0.0-rc.1 (2026-06-10)

This was a version bump only for core to align it with other projects, there were no code changes.

## 1.0.0-rc.0 (2026-06-09)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.17.0 (2026-06-08)

### 🚀 Features

- **core:** validation-aware submit buttons ([#167](https://github.com/golemui/golemui/pull/167))

### 🩹 Fixes

- **core:** form-widget fixes ([#165](https://github.com/golemui/golemui/pull/165))
- **core:** action label should be optional ([#164](https://github.com/golemui/golemui/pull/164))
- **core:** sync touched on widgets added after VALIDATE_ALL ([#163](https://github.com/golemui/golemui/pull/163))
- **core:** clear `data` after an input widget is removed ([#157](https://github.com/golemui/golemui/pull/157))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 0.16.2 (2026-05-30)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.16.1 (2026-05-30)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.16.0 (2026-05-30)

### 🚀 Features

- **core:** improved string interpolation with full expression support ([#143](https://github.com/golemui/golemui/pull/143))

### ❤️ Thank You

- mudscientist

## 0.15.1 (2026-05-27)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.15.0 (2026-05-26)

### 🚀 Features

- **core:** add actionType: 'submit' to action widgets ([#120](https://github.com/golemui/golemui/pull/120))

### 🩹 Fixes

- release from 0.0.0 ([#134](https://github.com/golemui/golemui/pull/134))

### ❤️ Thank You

- Mud Scientist
- mudscientist
- Raul Jimenez @Elecash
- Raúl Jiménez @Elecash

## 0.14.0 (2026-05-21)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.13.3 (2026-05-19)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.13.2 (2026-05-19)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.13.1 (2026-05-18)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.13.0 (2026-05-18)

### 🚀 Features

- **core,gui-shared:** introduce /internals subpath ([#90](https://github.com/golemui/golemui/pull/90))

### ❤️ Thank You

- mudscientist

## 0.12.2 (2026-05-16)

This was a version bump only for core to align it with other projects, there were no code changes.

## 0.12.1 (2026-05-16)

### 🩹 Fixes

- **schemas:** fix json schema deployment when releasing - pt.2 ([#88](https://github.com/golemui/golemui/pull/88))

### ❤️ Thank You

- mudscientist

## 0.12.0 (2026-05-16)

This was a version bump only for core to align it with other projects, there were no code changes.