// Cross-package entry point for symbols shared with other @golemui packages that
// are not part of the stable public API (see "Export conventions" in CONTRIBUTING.md).
// The widget contract types (WithWidget, WidgetLoaders) live in index.ts because
// custom-widget authors need them and apps cannot import internals.

// Widget model helpers, used by plugins that walk a form definition (@golemui/webmcp).
export { isFunctionWidget, isInputWidget, isLayoutWidget } from './lib/form-widget';
export { isTranslationConfig } from './lib/i18n';
export type { TranslationConfig } from './lib/i18n';
export { flattenForm, inputPath, pruneHiddenData } from './lib/utils/form';
export { get, pathExists, set } from './lib/utils/object';
export { isRepeaterWidget } from './lib/utils/repeater';
export type { RepeaterTemplateWidget } from './lib/utils/repeater';
