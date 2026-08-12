// Entry point of the `@golemui/schemas/generator` subpath: the file-writing generator
// an implementation package runs to (re)build its schema tree. Kept out of the main
// entry so importing the schemas does not pull in `node:fs`.
export { generateImplementationSchemas } from './lib/generator/generate-implementation-schemas.js';
