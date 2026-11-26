import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/react';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import {
  breadcrumbLabel,
  breadcrumbTrail,
  type BreadcrumbProps,
} from '@golemui/gui-shared/internals';
import { useEffect, useRef } from 'react';
import '@golemui/gui-components/breadcrumb';
import '../styles.scss';

/**
 * The breadcrumb action widget: a trail to the current page, with `gui-breadcrumb`. Picking a
 * step emits the widget's `click` event with `{ value }` as its detail.
 */
export function Breadcrumb(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, domId, templateData, emitClick } = useActionWidget<BreadcrumbProps>(widget);
  const host = useRef<HTMLDivElement>(null);
  const click = useRef(emitClick);
  click.current = emitClick;

  // The plain tag, which React 18 can't attach a custom event to: the host listens.
  useEffect(() => {
    const node = host.current;
    const onAction = (event: Event) =>
      click.current({ value: (event as CustomEvent<GuiActionEventDetail>).detail.value });
    node?.addEventListener('gui-action', onAction);
    return () => node?.removeEventListener('gui-action', onAction);
  }, []);

  return (
    <div ref={host} className="gui-breadcrumb gui-field">
      <gui-breadcrumb>
        <nav id={domId} aria-label={breadcrumbLabel(templateData.label)}>
          <ol>
            {breadcrumbTrail(templateData.items).map((step) => (
              <li key={step.value}>
                {step.current ? (
                  <span aria-current="page" data-cy={`${uid}_item_${step.value}`}>
                    {step.label as string}
                  </span>
                ) : (
                  <button
                    type="button"
                    value={step.value}
                    data-cy={`${uid}_item_${step.value}`}
                    disabled={templateData.disabled === true}
                  >
                    {step.label as string}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </gui-breadcrumb>
    </div>
  );
}
