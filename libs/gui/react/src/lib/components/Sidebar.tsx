import type { LayoutWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import type { GuiToggleEventDetail } from '@golemui/gui-components';
import {
  sidebarRegions,
  sidebarSideId,
  sidebarSideLabel,
  sidebarToggleLabel,
  type SidebarProps,
} from '@golemui/gui-shared/internals';
import { useEffect, useRef } from 'react';
import '@golemui/gui-components/sidebar';
import '../styles.scss';

/**
 * The sidebar layout widget: the side child next to the main one, with `gui-sidebar`. Below
 * 768px of its own width the side region becomes a drawer the toggle opens: the same element, so
 * the side child is rendered once and keeps its state.
 */
export function Sidebar(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { uid, domId, children, templateData, onChange } = useLayoutWidget<SidebarProps>(widget);
  const { side, main } = sidebarRegions(widget.uid, widget.children, children);
  const sideId = sidebarSideId(domId);

  const host = useRef<HTMLElement>(null);
  const change = useRef(onChange);
  change.current = onChange;

  // The plain tag, which React 18 can't attach a custom event to: the element listens itself.
  // A menu inside reports its groups with gui-toggle too: only the drawer's counts.
  useEffect(() => {
    const sidebar = host.current;
    if (!sidebar) return;
    const onToggle = (event: Event) => {
      if (event.target !== sidebar) return;
      change.current({ open: (event as CustomEvent<GuiToggleEventDetail>).detail.open });
    };
    sidebar.addEventListener('gui-toggle', onToggle);
    return () => sidebar.removeEventListener('gui-toggle', onToggle);
  }, []);

  return (
    <div className="gui-sidebar gui-field">
      <gui-sidebar ref={host} id={domId} side={templateData.side} side-size={templateData.sideSize}>
        {side ? (
          <>
            <button
              type="button"
              className="gui-sidebar__toggle"
              aria-label={sidebarToggleLabel(templateData.toggleLabel)}
              data-cy={`${uid}_toggle`}
              popoverTarget={sideId}
            />
            <aside
              className="gui-sidebar__side"
              id={sideId}
              aria-label={sidebarSideLabel(templateData.sideLabel)}
              data-cy={`${uid}_side`}
              popover="auto"
            >
              <WidgetRenderer widget={side} />
            </aside>
          </>
        ) : null}
        <div className="gui-sidebar__main" data-cy={`${uid}_main`}>
          {main ? <WidgetRenderer widget={main} /> : null}
        </div>
      </gui-sidebar>
    </div>
  );
}
