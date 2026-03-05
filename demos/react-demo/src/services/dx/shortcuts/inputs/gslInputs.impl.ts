import { createGslSelector } from '../../core/dxUtilityTypes';
import type { InputDecorator, GslInputsConfig } from './inputs.domain';

export const _gslInputs = createGslSelector<InputDecorator, GslInputsConfig>('INPUTS');
