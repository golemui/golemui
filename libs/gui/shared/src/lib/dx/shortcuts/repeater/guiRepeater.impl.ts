import type { ValidGuiShortcut } from '../../core/dx.domain';
import type { RepeaterDecorator, GuiRepeaterShortcut } from './repeater.domain';

type RepeaterFactoryConfig = Partial<RepeaterDecorator>;

export function _guiRepeater(
  path: string,
  config: RepeaterFactoryConfig,
  children: ValidGuiShortcut[],
  tags?: string[],
): GuiRepeaterShortcut;
export function _guiRepeater(
  path: string,
  children: ValidGuiShortcut[],
  tags?: string[],
): GuiRepeaterShortcut;
export function _guiRepeater(
  path: string,
  configOrChildren: RepeaterFactoryConfig | ValidGuiShortcut[],
  childrenOrTags?: ValidGuiShortcut[] | string[],
  maybeTags?: string[],
): GuiRepeaterShortcut {
  let config: RepeaterFactoryConfig;
  let children: ValidGuiShortcut[];
  let tags: string[];

  if (Array.isArray(configOrChildren)) {
    // Minimal signature: _guiRepeater(path, children, tags?)
    config = {};
    children = configOrChildren;
    tags = (childrenOrTags as string[] | undefined) ?? [];
  } else {
    // Full signature: _guiRepeater(path, config, children, tags?)
    config = configOrChildren;
    children = (childrenOrTags as ValidGuiShortcut[] | undefined) ?? [];
    tags = maybeTags ?? [];
  }

  return {
    type: 'ITEMS',
    itemType: 'REPEATER',
    items: [{ key: path, def: config, children }],
    tags,
  };
}
