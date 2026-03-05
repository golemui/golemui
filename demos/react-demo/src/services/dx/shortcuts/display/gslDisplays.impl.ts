import { createGslSelector } from '../../core/dxUtilityTypes';
import type { DisplayDecorator, GslDisplaysConfig } from './display.domain';

export const _gslDisplays = createGslSelector<DisplayDecorator, GslDisplaysConfig>('DISPLAYS');
