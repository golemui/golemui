// Types for the generated `lazy.js`: a loader per validator, each a dynamic import of the
// validator's own module. The modules are built by the nx target `generate-validators`
// (`npm run generate:validators`) and are not committed.
import type { ValidateFunction } from 'ajv';

export type ValidatorLoader = () => Promise<ValidateFunction>;

export declare const loadRootValidator: ValidatorLoader;
export declare const loadChunkRefValidator: ValidatorLoader;
export declare const SHALLOW_WIDGET_LOADERS: Readonly<Record<string, ValidatorLoader>>;
export declare const VALIDATOR_BRANCH_LOADERS: Readonly<Record<string, ValidatorLoader>>;
export declare const CUSTOM_WIDGET_LOADERS: Readonly<Record<string, ValidatorLoader>>;
