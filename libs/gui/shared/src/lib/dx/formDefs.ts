import { guiImplementation } from './gui';

/**
 * The gui widget set's DX form-definition service: transforms `gui.*` form
 * definitions into fully-fledged core forms. Built by the gui
 * `createImplementation` call in `gui.ts`; re-exported here so the
 * pre-refactor import path keeps working.
 */
export const formDefs = guiImplementation.formDefs;
