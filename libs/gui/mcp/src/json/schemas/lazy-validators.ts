/**
 * Loads the generated validators on demand, for browsers: a form with five widget types loads
 * the validators of those five, not of every widget. Each validator is its own module, imported
 * with a dynamic `import()` the first time a form needs it, and kept for the next forms.
 */
import type { ValidateFunction } from 'ajv';
import { collectFormErrors } from '../errors';
import {
  CUSTOM_WIDGET_LOADERS,
  loadChunkRefValidator,
  loadRootValidator,
  SHALLOW_WIDGET_LOADERS,
  VALIDATOR_BRANCH_LOADERS,
  type ValidatorLoader,
} from './generated/lazy.js';
import { lookupOwn, type ValidatorLookup } from './validator-lookup';

type Family = 'root' | 'chunkRef' | 'shallowWidget' | 'validatorBranch' | 'customWidget';

const LOADERS: Record<Family, Readonly<Record<string, ValidatorLoader>>> = {
  root: { '': loadRootValidator },
  chunkRef: { '': loadChunkRefValidator },
  shallowWidget: SHALLOW_WIDGET_LOADERS,
  validatorBranch: VALIDATOR_BRANCH_LOADERS,
  customWidget: CUSTOM_WIDGET_LOADERS,
};

/** The validators a form needs, by family. */
export type ValidatorNeeds = Record<Family, Set<string>>;

const loaded = new Map<string, ValidateFunction>();
const loading = new Map<string, Promise<ValidateFunction>>();

function cacheKey(family: Family, key: string): string {
  return `${family}:${key}`;
}

function load(family: Family, key: string): Promise<ValidateFunction> | null {
  const loader = lookupOwn(LOADERS[family], key);
  if (!loader) return null;
  const id = cacheKey(family, key);
  const ready = loaded.get(id);
  if (ready) return Promise.resolve(ready);
  let pending = loading.get(id);
  if (!pending) {
    pending = loader().then(
      (validate) => {
        loaded.set(id, validate);
        loading.delete(id);
        return validate;
      },
      (error: unknown) => {
        // Forget a failed load (a network error, say), so the next call tries again.
        loading.delete(id);
        throw error;
      },
    );
    loading.set(id, pending);
  }
  return pending;
}

const ALWAYS_VALID = Object.assign(() => true, { errors: null }) as unknown as ValidateFunction;

/**
 * Lists the validators the walk asks for on this form. It runs the walk itself with validators
 * that accept everything and record each request: which validators the walk asks for depends
 * only on the form (its types, kinds and validator types), never on what a validator returns.
 */
export function collectValidatorNeeds(formDefinition: unknown): ValidatorNeeds {
  const needs: ValidatorNeeds = {
    root: new Set(['']),
    chunkRef: new Set(),
    shallowWidget: new Set(),
    validatorBranch: new Set(),
    customWidget: new Set(),
  };
  const record = (family: Family, key: string): ValidateFunction | null => {
    if (!lookupOwn(LOADERS[family], key)) return null;
    needs[family].add(key);
    return ALWAYS_VALID;
  };
  collectFormErrors(formDefinition, {
    root: () => ALWAYS_VALID,
    chunkRef: () => {
      needs.chunkRef.add('');
      return ALWAYS_VALID;
    },
    shallowWidget: (widgetType) => record('shallowWidget', widgetType),
    validatorBranch: (validatorType) => record('validatorBranch', validatorType),
    customWidget: (kind) => record('customWidget', kind),
  });
  return needs;
}

/** Loads every validator in `needs` and returns a lookup over the loaded ones. */
export async function loadValidators(needs: ValidatorNeeds): Promise<ValidatorLookup> {
  const pending: Promise<ValidateFunction>[] = [];
  for (const family of Object.keys(needs) as Family[]) {
    for (const key of needs[family]) {
      const promise = load(family, key);
      if (promise) pending.push(promise);
    }
  }
  await Promise.all(pending);
  return LOADED_VALIDATORS;
}

function loadedValidator(family: Family, key: string): ValidateFunction | null {
  return lookupOwn(LOADERS[family], key) ? requireLoaded(family, key) : null;
}

function requireLoaded(family: Family, key: string): ValidateFunction {
  const validate = loaded.get(cacheKey(family, key));
  if (!validate) {
    // `collectValidatorNeeds` missed a validator the walk asks for.
    throw new Error(`The ${family} validator "${key}" was not loaded before validating`);
  }
  return validate;
}

const LOADED_VALIDATORS: ValidatorLookup = {
  root: () => requireLoaded('root', ''),
  chunkRef: () => requireLoaded('chunkRef', ''),
  shallowWidget: (widgetType) => loadedValidator('shallowWidget', widgetType),
  validatorBranch: (validatorType) => loadedValidator('validatorBranch', validatorType),
  customWidget: (kind) => loadedValidator('customWidget', kind),
};

/**
 * Starts loading the root validator, every validator branch and the given widget types, without
 * validating. Unknown widget types are ignored (they validate as custom widgets).
 */
export async function preloadValidators(widgetTypes: readonly string[] = []): Promise<void> {
  const pending: (Promise<ValidateFunction> | null)[] = [load('root', '')];
  for (const validatorType of Object.keys(VALIDATOR_BRANCH_LOADERS)) {
    pending.push(load('validatorBranch', validatorType));
  }
  for (const widgetType of widgetTypes) {
    pending.push(load('shallowWidget', widgetType));
  }
  await Promise.all(pending);
}
