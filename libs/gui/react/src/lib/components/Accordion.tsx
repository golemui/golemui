import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import {
  accordionButtonId,
  accordionSectionId,
  type AccordionProps,
  repeaterIndexSuffix,
} from '@golemui/gui-shared/internals';
import { useCallback, useEffect, useState } from 'react';

const empty = {};

export function Accordion(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { uid, children, templateData, onChange } = useLayoutWidget<AccordionProps>(widget);
  const [activeSections, setActiveSections] =
    useState<NonNullable<AccordionProps['defaultOpen']>>(empty);

  useEffect(() => {
    if (activeSections === empty && templateData.defaultOpen) {
      setActiveSections(templateData.defaultOpen || {});
    }
  }, [activeSections, templateData]);

  const onClickButton = useCallback(
    (uid: string) => {
      const newState: typeof activeSections = { ...activeSections };

      if (templateData.singleOpen) {
        Object.keys(newState)
          .filter((sectionUid) => sectionUid !== uid)
          .forEach((sectionUid) => {
            newState[sectionUid] = sectionUid === uid ? !newState[sectionUid] : false;
          });
      }

      newState[uid] = !newState[uid];

      setActiveSections(newState);
      onChange(newState);
    },
    [activeSections, templateData.singleOpen, onChange],
  );

  // Section uids come from the props without row indexes, the children come from the store with
  // them, so the lookup adds this accordion's own suffix.
  const rowIndexSuffix = repeaterIndexSuffix(widget.uid);

  const renderContent = useCallback(
    (sectionUid: string) => {
      const child = children.find(
        (section) => section.uid === `${sectionUid}${rowIndexSuffix}`,
      ) as NonFunctionWidget<string>;
      const isActiveSection = activeSections[sectionUid];
      return (isActiveSection || templateData.renderMode !== 'activeOnly') && child ? (
        <section
          className="gui-widget"
          role="region"
          id={accordionSectionId(widget.uid, sectionUid)}
          hidden={!isActiveSection && templateData.renderMode !== 'activeOnly'}
          aria-labelledby={accordionButtonId(widget.uid, sectionUid)}
        >
          <WidgetRenderer widget={child} />
        </section>
      ) : null;
    },
    [children, activeSections, templateData.renderMode, widget, rowIndexSuffix],
  );

  const renderAccordion = useCallback(() => {
    const sections = templateData.sections || [];
    return sections.map((section) => (
      <div className="gui-accordion__section" key={accordionSectionId(widget.uid, section.uid)}>
        <button
          type="button"
          tabIndex={0}
          id={accordionButtonId(widget.uid, section.uid)}
          aria-controls={accordionSectionId(widget.uid, section.uid)}
          aria-expanded={activeSections[section.uid] ? 'true' : 'false'}
          className={activeSections[section.uid] ? 'active' : ''}
          onClick={() => onClickButton(section.uid)}
        >
          {section.label as string}
          <span className="gui-accordion__arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
            </svg>
          </span>
        </button>

        {renderContent(section.uid)}
      </div>
    ));
  }, [templateData.sections, activeSections, renderContent, onClickButton, widget]);

  return (
    <div className="gui-accordion gui-field" style={{ flex: templateData.size }}>
      <div className="gui-widget" id={uid}>
        {renderAccordion()}
      </div>
    </div>
  );
}
