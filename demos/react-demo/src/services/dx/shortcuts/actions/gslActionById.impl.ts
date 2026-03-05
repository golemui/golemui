import { createGslSelector } from '../../core/dxUtilityTypes';
import type { ActionDecorator, GslActionsConfig } from './actions.domain';

const createByIdSelector = createGslSelector<ActionDecorator, GslActionsConfig>('ACTIONS');

export function _gslActionById(id: string, config: GslActionsConfig) {
  return createByIdSelector(config, (d) => d.uid === id);
}
