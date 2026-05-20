import { objectUtils } from '../../../utils/objectUtils.service';
import { GuiItemTypes } from '../../core/dx.domain';
import { type DefOrCallback, type DxRuntimeParams } from '../../core/dxUtilityTypes';
import { type ActionDecorator, type GuiActionsShortcut } from './actions.domain';

export function _guiButton(props: ActionDecorator): GuiActionsShortcut;
export function _guiButton(props: ActionDecorator, tags: string[]): GuiActionsShortcut;
export function _guiButton(
  callback: (params: DxRuntimeParams) => Partial<ActionDecorator>,
): GuiActionsShortcut;
export function _guiButton(
  callback: (params: DxRuntimeParams) => Partial<ActionDecorator>,
  tags: string[],
): GuiActionsShortcut;
export function _guiButton(
  propsOrCallback: ActionDecorator | ((params: DxRuntimeParams) => Partial<ActionDecorator>),
  tags?: string[],
): GuiActionsShortcut {
  return {
    items: [propsOrCallback],
    type: 'ITEMS',
    itemType: GuiItemTypes.ACTIONS,
    tags: tags ?? [],
  };
}

type ActionWithoutOnClickDefOrCallback = DefOrCallback<Omit<ActionDecorator, 'onClick'>>;
type ActionDecoratorWithoutClick = Omit<ActionDecorator, 'onClick'>;

export const _guiSubmitButton = (
  defs?: ActionDecoratorWithoutClick | ActionWithoutOnClickDefOrCallback,
): GuiActionsShortcut => {
  const baseSubmit: ActionDecorator & { on: { click: string } } = {
    uid: '#submit',
    label: 'Submit',
    // `on` on `gui.actions.button` is hidden, but we need to preset it to 'sumbit'
    // here so it can be properly handled by `EventWiringService`
    on: { click: 'submit' },
  };
  const merged = defs != null ? objectUtils.deepMerge(baseSubmit, defs) : baseSubmit;
  return _guiButton(merged);
};
