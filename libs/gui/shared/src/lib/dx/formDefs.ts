import { createDxService, GuiItemTypes, type DxAdapter, type ValidGuiShortcut } from '@golemui/dx';
import { _guiDisplay } from './shortcuts/display/guiDisplay.impl';
import { type LayoutEntry } from './shortcuts/layouts/layouts.domain';
import { guiRegistry } from './registry';

// The gui choices for the generic DX pipeline: a bare function in a form
// definition becomes a gui display widget, and the auto-stack root is the
// reserved 'flex' layout rendered as a vertical column.
const guiAdapter: DxAdapter = {
  bareItemToWidget: (renderFn) => _guiDisplay(renderFn),
  rootEntry: (children: ValidGuiShortcut[]) => {
    const rootEntry: LayoutEntry = {
      def: { uid: '#root', direction: 'column', widgetName: 'flex' },
      children,
    };
    return { type: 'ITEMS', itemType: GuiItemTypes.LAYOUTS, items: [rootEntry], tags: [] };
  },
};

/**
 * The gui widget set's DX form-definition service: transforms `gui.*` form
 * definitions into fully-fledged core forms.
 */
export const formDefs = createDxService({ registry: guiRegistry, adapter: guiAdapter });
