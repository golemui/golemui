import type { ValidGuiShortcut } from '@golemui/dx';
import type { RepeaterDecorator, GuiRepeaterShortcut } from './repeater.domain';

export interface RepeaterProps extends Omit<Partial<RepeaterDecorator>, 'template'> {
  template: ValidGuiShortcut[];
}

export function _guiRepeater(
  path: string,
  props: RepeaterProps,
  tags?: string[],
): GuiRepeaterShortcut {
  const { template, ...config } = props;
  return {
    type: 'ITEMS',
    itemType: 'REPEATER',
    items: [{ key: path, def: config, children: template }],
    tags: tags ?? [],
  };
}
