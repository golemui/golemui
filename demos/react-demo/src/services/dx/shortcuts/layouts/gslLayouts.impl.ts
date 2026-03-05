import { createGslSelector } from '../../core/dxUtilityTypes';
import type { LayoutDecorator, GslLayoutsConfig } from './layouts.domain';

export const _gslLayouts = createGslSelector<LayoutDecorator, GslLayoutsConfig>('LAYOUTS');
