// Cross-package entry point for symbols shared with other @golemui packages that
// are not part of the stable public API (see "Export conventions" in CONTRIBUTING.md).
// Currently empty: the widget contract types (WithWidget, WidgetLoaders) live in
// index.ts because custom-widget authors need them and apps cannot import internals.
export {};
