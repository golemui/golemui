// ===================================================
// @golemui/ui-testing/core-features - the widget-set-independent test suites.
//
// These suites exercise core form behavior (data flow, events, states,
// validation wiring, i18n, and so on) through a mount fixture the consuming
// package provides, so any widget set implementation can run them against
// its own form component. The gui widget suites stay on the root entry
// point.
//
// Known limitation: the suite bodies still express their forms in the gui
// widget vocabulary (type names, data-cy selectors, css class names) and the
// standard validator config shape. Running them against a second
// implementation requires the widget-role mapping described in the
// multi-implementation design, which will be shaped by the first second-
// implementation pilot.
// ===================================================

export * from './lib/core-features/actions.cy';
export * from './lib/core-features/data.cy';
export * from './lib/core-features/dependencies.cy';
export * from './lib/core-features/disabled.cy';
export * from './lib/core-features/events.cy';
export * from './lib/core-features/host-functions.cy';
export * from './lib/core-features/i18n.cy';
export * from './lib/core-features/include-exclude.cy';
export * from './lib/core-features/label.cy';
export * from './lib/core-features/middlewares.cy';
export * from './lib/core-features/reactive-functions.cy';
export * from './lib/core-features/readonly.cy';
export * from './lib/core-features/required.cy';
export * from './lib/core-features/set-data-set-meta.cy';
export * from './lib/core-features/states.cy';
export * from './lib/core-features/string-interpolation.cy';
export * from './lib/core-features/uid.cy';
export * from './lib/core-features/validator-injection.cy';
export * from './lib/core-features/widget-loaders.cy';

export * from './lib/test-form';
export * from './lib/utils';
