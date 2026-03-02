import * as Core from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import { AccordionProps } from '@golemui/gui-shared';
import { useCallback, useEffect, useState } from 'react';

const empty = {};

export function Accordion(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.LayoutWidget;
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

  const renderContent = useCallback(
    (uid: string) => {
      const child = children.find(
        (section) => section.uid === uid,
      ) as Core.NonFunctionWidget<string>;
      const isActiveSection = activeSections[uid];
      return (isActiveSection || templateData.renderMode !== 'activeOnly') && child ? (
        <section
          className="gui-widget"
          role="region"
          id={`accordion_section_${uid}`}
          hidden={!isActiveSection && templateData.renderMode !== 'activeOnly'}
          aria-labelledby={`accordion_button_${uid}`}
        >
          <WidgetRenderer widget={child} />
        </section>
      ) : null;
    },
    [children, activeSections, templateData.renderMode],
  );

  const renderAccordion = useCallback(() => {
    const sections = templateData.sections || [];
    return sections.map((section, index) => (
      <div className="gui-accordion__section" key={`${'accordion_section_' + section.uid}`}>
        <button
          type="button"
          id={`accordion_button_${section.uid}`}
          aria-controls={`accordion_section_${section.uid}`}
          aria-expanded={activeSections[section.uid] ? 'true' : 'false'}
          className={activeSections[section.uid] ? 'active' : ''}
          onClick={() => onClickButton(section.uid)}
        >
          {section.label}
          <span className="gui-accordion__icon"></span>
        </button>

        {renderContent(section.uid)}
      </div>
    ));
  }, [templateData.sections, activeSections, renderContent, onClickButton]);

  return (
    <div className="gui-accordion" style={{ flex: templateData.size }}>
      <div className="gui-widget" id={uid}>
        {renderAccordion()}
      </div>
    </div>
  );
}
