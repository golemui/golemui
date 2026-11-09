// Types for the generated `sync.js`: every validator, imported statically. The modules are built
// by the nx target `generate-validators` (`npm run generate:validators`) and are not committed.
import type { ValidateFunction } from 'ajv';

export declare const rootValidator: ValidateFunction;
export declare const chunkRefValidator: ValidateFunction;
export declare const SHALLOW_WIDGET_VALIDATORS: Readonly<Record<string, ValidateFunction>>;
export declare const VALIDATOR_BRANCH_VALIDATORS: Readonly<Record<string, ValidateFunction>>;
export declare const CUSTOM_WIDGET_VALIDATORS: Readonly<Record<string, ValidateFunction>>;
