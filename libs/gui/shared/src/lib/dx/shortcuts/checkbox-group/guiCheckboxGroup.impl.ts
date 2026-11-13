import { type DxRuntimeParams } from '@golemui/dx';
import type {
  CheckboxGroupDecorator,
  CheckboxGroupEntry,
  GuiCheckboxGroupShortcut,
} from './checkbox-group.domain';

type CheckboxGroupFactoryProps = Omit<CheckboxGroupDecorator, 'type'>;

export function _guiCheckboxGroup(
  path: string,
  props: CheckboxGroupFactoryProps,
): GuiCheckboxGroupShortcut;
export function _guiCheckboxGroup(
  path: string,
  props: CheckboxGroupFactoryProps,
  tags: string[],
): GuiCheckboxGroupShortcut;
export function _guiCheckboxGroup(
  path: string,
  callback: (params: DxRuntimeParams) => CheckboxGroupFactoryProps,
  tags?: string[],
): GuiCheckboxGroupShortcut;
export function _guiCheckboxGroup(
  path: string,
  propsOrCallback:
    | CheckboxGroupFactoryProps
    | ((params: DxRuntimeParams) => CheckboxGroupFactoryProps),
  tags?: string[],
): GuiCheckboxGroupShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'checkboxGroup' as const,
      ...callback(params),
    });
    const items: CheckboxGroupEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'CHECKBOX_GROUP', items, tags: tags ?? [] };
  }

  const def: CheckboxGroupDecorator = { type: 'checkboxGroup', ...propsOrCallback };
  const items: CheckboxGroupEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'CHECKBOX_GROUP', items, tags: tags ?? [] };
}
