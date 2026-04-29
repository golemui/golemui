import type { GslInputsConfig } from './inputs.domain';
import { _gslInputs } from './register';

export const _gslTextInputs = (config: GslInputsConfig) =>
  _gslInputs(config, (d) => d.type === 'text');

export const _gslNumberInputs = (config: GslInputsConfig) =>
  _gslInputs(config, (d) => d.type === 'number');

export const _gslBooleanInputs = (config: GslInputsConfig) =>
  _gslInputs(config, (d) => d.type === 'boolean');
