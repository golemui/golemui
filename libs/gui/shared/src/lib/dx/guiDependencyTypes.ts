// ===================================================
// The DX types that carry a dependency shape, bound to the gui widget set's
// own `Dependencies`.
//
// `@golemui/dx` declares these types generic over the dependency shape and
// defaults them to the open `Record<string, unknown>`, because the pipeline
// itself does not care what a widget set injects. gui-shared re-exports them
// under their original names bound to the gui shape, so gui form authors keep
// the documented keys (`dependencies.markdown`) typed on both entry points.
//
// A second widget set does the same with its own dependency type. Nothing here
// is gui-specific except the `Dependencies` import.
// ===================================================

import type { UiState } from '@golemui/core';
import type {
  DxFormConfig as DxFormConfigOf,
  DxResult as DxResultOf,
  FormConfig as FormConfigOf,
  ResolvedFormInput as ResolvedFormInputOf,
} from '@golemui/dx';
import type { Dependencies } from '../shared';

/** Form-level settings, with the gui dependency keys typed. */
export type FormConfig = FormConfigOf<Dependencies>;

/**
 * Form-level settings for `processDxFacade`'s third argument, generic over the
 * declared state names, with the gui dependency keys typed.
 */
export type DxFormConfig<S extends string = string> = DxFormConfigOf<S, Dependencies>;

/** The DX pipeline output, with the gui dependency keys typed. */
export type DxResult<S extends UiState = never, F extends Record<string, any> = any> = DxResultOf<
  S,
  F,
  Dependencies
>;

/** The resolved framework form input, with the gui dependency keys typed. */
export type ResolvedFormInput<FormData extends Record<string, any> = any> = ResolvedFormInputOf<
  FormData,
  Dependencies
>;
