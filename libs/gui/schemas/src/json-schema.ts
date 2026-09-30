// Entry point of the `@golemui/gui-schemas/json-schema` subpath: the gui preset for the
// JSON Schema converter in `@golemui/schemas/json-schema`. It imports only types from there,
// so the bundle holds this package's own code only.
export { guiPreset, type GuiPresetOptions } from './lib/json-schema/gui-preset.js';
export { guiValidator } from './lib/json-schema/gui-validator.js';
