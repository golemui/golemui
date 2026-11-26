import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import type { GuiActionEventDetail, GuiMenuToggleEventDetail } from '@golemui/gui-components';
import {
  isMenuGroup,
  menuGroupId,
  menuItemCy,
  menuOpenGroups,
  toggleMenuGroup,
  type MenuItem,
  type MenuProps,
} from '@golemui/gui-shared/internals';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import '@golemui/gui-components/menu';
import '../styles.scss';

/**
 * The menu action widget: a navigation menu, with `gui-menu`. Picking a destination emits the
 * widget's `click` event with `{ value }` as its detail; a group's button only opens the group.
 * The groups that hold `current` open when it changes, and the user's own toggles stay until then.
 */
export function Menu(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, domId, templateData, emitClick } = useActionWidget<MenuProps>(widget);
  const { items, current, orientation, label, disabled } = templateData;
  const horizontal = orientation === 'horizontal';

  const [open, setOpen] = useState<string[]>(() => menuOpenGroups([], items, current));
  const [followed, setFollowed] = useState(current);
  if (current !== followed) {
    setFollowed(current);
    setOpen(menuOpenGroups(open, items, current));
  }

  const host = useRef<HTMLDivElement>(null);
  const click = useRef(emitClick);
  click.current = emitClick;

  // The plain tag, which React 18 can't attach a custom event to: the host listens. The element
  // has opened or closed a group already, and the state follows it.
  useEffect(() => {
    const node = host.current;
    const onAction = (event: Event) =>
      click.current({ value: (event as CustomEvent<GuiActionEventDetail>).detail.value });
    const onToggle = (event: Event) => {
      const { value, open: isOpen } = (event as CustomEvent<GuiMenuToggleEventDetail>).detail;
      setOpen((groups) => toggleMenuGroup(groups, value, isOpen));
    };
    node?.addEventListener('gui-action', onAction);
    node?.addEventListener('gui-toggle', onToggle);
    return () => {
      node?.removeEventListener('gui-action', onAction);
      node?.removeEventListener('gui-toggle', onToggle);
    };
  }, []);

  const renderItems = (list: MenuItem[] | undefined, dropdowns: boolean): ReactNode =>
    (list ?? []).map((item) => {
      const off = disabled === true || item.disabled === true;
      const content = (
        <>
          {item.icon ? (
            <span
              className={`gui-widget-icon ${item.icon}`}
              data-icon={item.icon}
              aria-hidden="true"
            />
          ) : null}
          <span>{item.label as string}</span>
        </>
      );

      if (!isMenuGroup(item)) {
        return (
          <li key={item.value}>
            <button
              type="button"
              value={item.value}
              data-cy={menuItemCy(uid, item.value)}
              aria-current={item.value === current ? 'page' : undefined}
              disabled={off}
            >
              {content}
            </button>
          </li>
        );
      }

      const listId = menuGroupId(domId, item.value);
      if (dropdowns) {
        return (
          <li key={item.value}>
            <button
              type="button"
              value={item.value}
              data-cy={menuItemCy(uid, item.value)}
              popoverTarget={listId}
              disabled={off}
            >
              {content}
            </button>
            <gui-popover>
              <ul id={listId} popover="auto">
                {renderItems(item.items, false)}
              </ul>
            </gui-popover>
          </li>
        );
      }

      const isOpen = open.includes(item.value);
      return (
        <li key={item.value}>
          <button
            type="button"
            value={item.value}
            data-cy={menuItemCy(uid, item.value)}
            aria-expanded={isOpen}
            aria-controls={listId}
            disabled={off}
          >
            {content}
          </button>
          <ul id={listId} hidden={!isOpen}>
            {renderItems(item.items, false)}
          </ul>
        </li>
      );
    });

  return (
    <div ref={host} className="gui-menu gui-field">
      <gui-menu orientation={horizontal ? 'horizontal' : undefined}>
        <nav id={domId} aria-label={typeof label === 'string' && label !== '' ? label : undefined}>
          <ul>{renderItems(items, horizontal)}</ul>
        </nav>
      </gui-menu>
    </div>
  );
}
