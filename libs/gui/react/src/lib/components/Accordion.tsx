import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import type { GuiToggleEventDetail } from '@golemui/gui-components';
import {
  accordionButtonId,
  accordionSectionId,
  type AccordionProps,
  repeaterIndexSuffix,
} from '@golemui/gui-shared/internals';
import { useEffect, useState } from 'react';
import { GuiAccordionItemReact, GuiAccordionReact } from '../web-components';

const empty = {};

export function Accordion(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { uid, children, templateData, onChange } = useLayoutWidget<AccordionProps>(widget);
  const [activeSections, setActiveSections] =
    useState<NonNullable<AccordionProps['defaultOpen']>>(empty);
  // Section uids come from the props without row indexes, the children come from the store with
  // them, so the lookup adds this accordion's own suffix.
  const rowIndexSuffix = repeaterIndexSuffix(widget.uid);

  useEffect(() => {
    if (activeSections === empty && templateData.defaultOpen) {
      setActiveSections(templateData.defaultOpen || {});
    }
  }, [activeSections, templateData]);

  const onToggle = (event: CustomEvent<GuiToggleEventDetail>, sectionUid: string) => {
    // An accordion nested in a section fires its own.
    if (event.target !== event.currentTarget) return;
    const { open } = event.detail;
    if (!!activeSections[sectionUid] === open) return;

    const next: typeof activeSections = { ...activeSections };
    if (open && templateData.singleOpen) {
      Object.keys(next).forEach((key) => {
        next[key] = false;
      });
    }
    next[sectionUid] = open;
    setActiveSections(next);
    onChange(next);
  };

  return (
    <div className="gui-accordion gui-field" style={{ flex: templateData.size }}>
      <GuiAccordionReact id={uid} multiple={!templateData.singleOpen}>
        {(templateData.sections ?? []).map((section) => {
          const isOpen = !!activeSections[section.uid];
          const child = children.find(
            (candidate) => candidate.uid === `${section.uid}${rowIndexSuffix}`,
          ) as NonFunctionWidget<string> | undefined;

          return (
            <GuiAccordionItemReact
              key={section.uid}
              open={isOpen}
              onGuiToggle={(event) => onToggle(event, section.uid)}
            >
              <details open={isOpen}>
                <summary id={accordionButtonId(widget.uid, section.uid)}>
                  {section.label as string}
                </summary>
                {child && (isOpen || templateData.renderMode !== 'activeOnly') ? (
                  <section
                    className="gui-widget"
                    role="region"
                    id={accordionSectionId(widget.uid, section.uid)}
                    aria-labelledby={accordionButtonId(widget.uid, section.uid)}
                  >
                    <WidgetRenderer widget={child} />
                  </section>
                ) : null}
              </details>
            </GuiAccordionItemReact>
          );
        })}
      </GuiAccordionReact>
    </div>
  );
}
