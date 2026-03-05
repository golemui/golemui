import { createGslSelector } from '../../core/dxUtilityTypes';
import type { ActionDecorator, GslActionsConfig } from './actions.domain';

export const _gslActions = createGslSelector<ActionDecorator, GslActionsConfig>('ACTIONS');
