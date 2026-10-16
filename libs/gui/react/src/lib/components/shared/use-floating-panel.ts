import { GUIFloatingPanel } from '@golemui/gui-components/internals';
import { useRef, type RefObject } from 'react';
import { useBrowserLayoutEffect } from './use-browser-layout-effect';

/**
 * Shows a field's panel (rendered with `popover="manual"`) in the top layer while `open`, placed
 * under the field, so no container clips it. The component keeps deciding when it opens.
 */
export function useFloatingPanel(
  panel: RefObject<HTMLElement | null>,
  field: RefObject<Element | null>,
  open: boolean,
): void {
  const floating = useRef<GUIFloatingPanel | null>(null);

  useBrowserLayoutEffect(() => {
    const instance = new GUIFloatingPanel({
      panel: () => panel.current,
      anchor: () => field.current,
    });
    floating.current = instance;
    return () => {
      instance.dispose();
      floating.current = null;
    };
  }, [panel, field]);

  useBrowserLayoutEffect(() => {
    floating.current?.sync(open);
  }, [open]);
}
