/**
 * Every generated validator, imported statically, for the synchronous `validateFormDefinition`
 * (the MCP server, the CLI, Node and Workers through `@golemui/gui-mcp/json`).
 *
 * The validators are generated at build time (see `validator-schemas.ts`) because Workers and
 * pages under a strict CSP do not allow the code generation that ajv does when it compiles a
 * schema.
 */
import {
  chunkRefValidator,
  CUSTOM_WIDGET_VALIDATORS,
  rootValidator,
  SHALLOW_WIDGET_VALIDATORS,
  VALIDATOR_BRANCH_VALIDATORS,
} from './generated/sync.js';
import { lookupOwn, type ValidatorLookup } from './validator-lookup';

export const SYNC_VALIDATORS: ValidatorLookup = {
  root: () => rootValidator,
  chunkRef: () => chunkRefValidator,
  shallowWidget: (widgetType) => lookupOwn(SHALLOW_WIDGET_VALIDATORS, widgetType),
  validatorBranch: (validatorType) => lookupOwn(VALIDATOR_BRANCH_VALIDATORS, validatorType),
  customWidget: (kind) => lookupOwn(CUSTOM_WIDGET_VALIDATORS, kind),
};
