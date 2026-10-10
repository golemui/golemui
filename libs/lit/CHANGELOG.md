## 2.0.0-rc.2 (2026-10-10)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 2.0.0-rc.1 (2026-10-09)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 2.0.0-rc.0 (2026-10-08)

### 🚀 Features

- ⚠️  **gui-components:** Make @golemui/gui-components a standalone project ([#406](https://github.com/golemui/golemui/pull/406))

### ⚠️  Breaking Changes

- **gui-components:** Make @golemui/gui-components a standalone project  ([#406](https://github.com/golemui/golemui/pull/406))
  Deprecate Flex layout
  * fix(gui-components): add migration guide to v2.0
  BREAKING CHANGE: GolemUI 2.0 makes @golemui/gui-components a standalone project.
  - Styles: index.css no longer includes the form container, repeater and
    invalid submit button styles. Import @golemui/gui-shared/forms.css after it.
  - Styles: every rule is in a golemui.* cascade layer, so unlayered app CSS,
    including global resets, now overrides component styles.
  - Styles: component selectors are no longer nested under .gui-form, and
    narrow layouts query the gui-container container instead of gui-form.
  - Layouts: a grid without direction is now a stack instead of a row. Add
    direction: 'row' to keep a row.
  - Layouts: flex is deprecated and renders as a grid. Grid gaps are tokens
    (none to xl) instead of pixels, justify places children along a row, and
    autoFit, columnGap, rowGap and align are deprecated. The root layout is grid.
  - Markup: tabs, accordions and alerts render gui-tabs, gui-accordion and
    gui-alert. Their old classes (.gui-accordion__section,
    .gui-alert-notification--*, .active) are gone, as are the .gui-flex and
    .gui-grid__widget classes. Errors render as divs instead of a ul.
  - Elements: every event is prefixed with gui- (input/change -> gui-input and
    gui-change, blur -> gui-blur, inputError -> gui-input-error, and so on),
    bubbles and is composed.
  - Elements: multi-word attributes are kebab-case (autogrow -> auto-grow).
  - Elements: gui-button's actionType is now type, and invalid is removed.
  - Elements: touched is unset by default, so errors show as soon as they are set.
  - Packages: @golemui/gui-components only peers on lit, and @golemui/gui-shared
    now depends on it. @golemui/gui-components/internals no longer exports
    createIntersectionObserver or NO_AVAILABLE_TIMES_MESSAGE.
  * chore: update gitignore
  * refactor(lit): move ssr to lit-utils
  move ssr to lit-utils
  * docs: update readme
  * refactor(lit): move ssr to lit-utils, add ssr to components
  * fix(gui-components): report missing upload service when dependencies are set
  * fix(gui-components): avoid duplicated ids in all pickers
  * fix(gui-components): set caret icon as a CSS property
  * test: check ssr parity across frameworks with components
  * ci: add workflow to test lit-labs/ssr against our implementation
  * feat(gui-components): add timeLabel prop to date-time inputs
  * chore: fix lint errors
  * chore: improve ssr performance
  * docs: move components ssr docs to website
  * fix(gui-components): send value in numeric inputs
  * feat(gui-components): add nitro plugin for nuxt users
  * fix(gui-components): avoid ssr rendering for time lists
  * chore: reset harnesses
  * docs: update components readme
  * fix(gui-components): misc issues related with required, aria and styling
  * test(gui-components): fix tests
  * test(gui-components): fix firefox test failing by 0.000001
  * fix(gui-components): fix layout issues with pickers
  * fix(schemas): make grid a the reserved root
  * fix(schemas): make grid a the reserved root
  * docs: fix astro template, update migration guide
  * fix(gui-components): avoid double hints in pickers
  * fix(gui-react): fix singleOpen in react accordion
  * fix(gui-components): fix currency stepping
  * fix(gui-components): reset value on form reset
  * fix(gui-components): Segmented date and time inputs keep an outdated validity
  * fix(gui-components): block pickers submissions with partly typed or impossible dates
  * fix(gui-components): Dates and times outside their bounds now block a native submit
  * fix(gui-components): block native submit with pending uploads in progress
  * test: fix typing issues with specs

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 1.6.0 (2026-10-03)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.6.0-rc.1 (2026-10-02)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.6.0-rc.0 (2026-10-02)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.5.1 (2026-09-23)

### 🩹 Fixes

- support strict CSP for client-side rendering ([#400](https://github.com/golemui/golemui/pull/400))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 1.5.1-rc.0 (2026-09-23)

### 🩹 Fixes

- support strict CSP for client-side rendering ([#400](https://github.com/golemui/golemui/pull/400))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 1.5.0 (2026-09-14)

### 🚀 Features

- **lit:** shim querySelector and export safeDefine for SSR ([#351](https://github.com/golemui/golemui/pull/351))
- **vue:** nuxt support ([#335](https://github.com/golemui/golemui/pull/335))
- **lit,gui-lit,gui-components:** support server-side rendering of forms ([#334](https://github.com/golemui/golemui/pull/334))
- **lit:** support the defer-hydration attribute in safeDefine ([55646c98](https://github.com/golemui/golemui/commit/55646c98))

### 🩹 Fixes

- **lit:** define the server query methods on the registered elements only ([#378](https://github.com/golemui/golemui/pull/378))
- **lit:** remove false-valued boolean attributes from the server markup ([#372](https://github.com/golemui/golemui/pull/372))
- **core:** deterministic function widget uids and default language ([#329](https://github.com/golemui/golemui/pull/329))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.5.0-rc.2 (2026-09-14)

### 🩹 Fixes

- **lit:** define the server query methods on the registered elements only ([#378](https://github.com/golemui/golemui/pull/378))
- **lit:** remove false-valued boolean attributes from the server markup ([#372](https://github.com/golemui/golemui/pull/372))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.5.0-rc.1 (2026-09-07)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.5.0-rc.0 (2026-09-04)

### 🚀 Features

- **lit:** shim querySelector and export safeDefine for SSR ([#351](https://github.com/golemui/golemui/pull/351))
- **vue:** nuxt support ([#335](https://github.com/golemui/golemui/pull/335))
- **lit,gui-lit,gui-components:** support server-side rendering of forms ([#334](https://github.com/golemui/golemui/pull/334))
- **lit:** support the defer-hydration attribute in safeDefine ([55646c98](https://github.com/golemui/golemui/commit/55646c98))

### 🩹 Fixes

- **core:** deterministic function widget uids and default language ([#329](https://github.com/golemui/golemui/pull/329))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.4.0 (2026-08-26)

### 🚀 Features

- **lit:** read the store through one widgetViewModel$ subscription per widget ([#302](https://github.com/golemui/golemui/pull/302))

### 🩹 Fixes

- recreate the widget tree when the form reinitializes ([#307](https://github.com/golemui/golemui/pull/307))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.4.0-rc.0 (2026-08-26)

### 🚀 Features

- **lit:** read the store through one widgetViewModel$ subscription per widget ([#302](https://github.com/golemui/golemui/pull/302))

### 🩹 Fixes

- recreate the widget tree when the form reinitializes ([#307](https://github.com/golemui/golemui/pull/307))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.3.0 (2026-08-16)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.3.0-rc.0 (2026-08-14)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.2.1 (2026-08-11)

### 🩹 Fixes

- avoid double registration warnings via shared safeDefine ([#278](https://github.com/golemui/golemui/pull/278))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 1.2.1-rc.0 (2026-08-11)

### 🩹 Fixes

- avoid double registration warnings via shared safeDefine ([#278](https://github.com/golemui/golemui/pull/278))

### ❤️ Thank You

- Raúl Jiménez @Elecash

## 1.2.0 (2026-08-04)

### 🚀 Features

- **lit:** add createFormComponent for building a form element class from a widget set ([b3f0a13c](https://github.com/golemui/golemui/commit/b3f0a13c))

### 🩹 Fixes

- **mcp:** correct lit and vanilla submit event names in DX grounding ([47cf777f](https://github.com/golemui/golemui/commit/47cf777f))
- **core:** make WithWidget and WidgetLoaders public-only ([#228](https://github.com/golemui/golemui/pull/228))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.1.1-rc.3 (2026-08-04)

### 🚀 Features

- **lit:** add createFormComponent for building a form element class from a widget set ([b3f0a13c](https://github.com/golemui/golemui/commit/b3f0a13c))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.1.1-rc.2 (2026-08-03)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.1.1-rc.1 (2026-08-02)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.1.1-rc.0 (2026-08-01)

### 🩹 Fixes

- **mcp:** correct lit and vanilla submit event names in DX grounding ([47cf777f](https://github.com/golemui/golemui/commit/47cf777f))
- **core:** make WithWidget and WidgetLoaders public-only ([#228](https://github.com/golemui/golemui/pull/228))

### ❤️ Thank You

- Mud Scientist @mudscientist
- Raúl Jiménez @Elecash

## 1.1.0 (2026-07-21)

### 🚀 Features

- `$fn` host functions for reactive expressions ([#227](https://github.com/golemui/golemui/pull/227))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 1.0.3 (2026-07-02)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.0.2 (2026-06-26)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.0.1 (2026-06-15)

This was a version bump only for lit to align it with other projects, there were no code changes.

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

This was a version bump only for lit to align it with other projects, there were no code changes.

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

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.0.0-rc.2 (2026-06-10)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.0.0-rc.1 (2026-06-10)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 1.0.0-rc.0 (2026-06-09)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.17.0 (2026-06-08)

### 🚀 Features

- **core:** validation-aware submit buttons ([#167](https://github.com/golemui/golemui/pull/167))

### ❤️ Thank You

- Mud Scientist @mudscientist

## 0.16.2 (2026-05-30)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.16.1 (2026-05-30)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.16.0 (2026-05-30)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.15.1 (2026-05-27)

This was a version bump only for lit to align it with other projects, there were no code changes.

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

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.13.3 (2026-05-19)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.13.2 (2026-05-19)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.13.1 (2026-05-18)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.13.0 (2026-05-18)

### 🚀 Features

- **core,gui-shared:** introduce /internals subpath ([#90](https://github.com/golemui/golemui/pull/90))

### ❤️ Thank You

- mudscientist

## 0.12.2 (2026-05-16)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.12.1 (2026-05-16)

This was a version bump only for lit to align it with other projects, there were no code changes.

## 0.12.0 (2026-05-16)

This was a version bump only for lit to align it with other projects, there were no code changes.