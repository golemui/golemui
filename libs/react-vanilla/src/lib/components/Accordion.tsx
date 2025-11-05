import * as Core from '@formforge/core';
import { FieldRenderer, useLayout } from '@formforge/react';
import { useCallback, useState } from 'react';
import { AccordionProps } from '@formforge/shared';

export function Accordion(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.LayoutField;
  const { uid, children, formContext, props } = useLayout<AccordionProps>(field);
  const [activeSections, setActiveSections] = useState(props.defaultOpen ?? {});

  const onClickButton = useCallback(
    (uid: string) => {
      setActiveSections((state) => {
        const newState = { ...state };

        if (props.singleOpen) {
          Object.keys(newState)
            .filter((sectionUid) => sectionUid !== uid)
            .forEach((sectionUid) => {
              newState[sectionUid] = sectionUid === uid ? !newState[sectionUid] : false;
            });
        }

        newState[uid] = !newState[uid];

        return newState;
      });
    },
    [props.singleOpen],
  );

  const renderContent = useCallback(
    (uid: string) => {
      const child = children.find((section) => section.uid === uid) as Core.FormField<string>;
      const isActiveSection = activeSections[uid];

      return isActiveSection && child ? (
        <section className="field" role="region">
          <FieldRenderer field={child} formContext={formContext} />
        </section>
      ) : null;
    },
    [children, formContext, activeSections],
  );

  const renderAccordion = useCallback(() => {
    return props.sections.map((section, index) => (
      <div className="ff-accordion-section" key={`${'accordion-section-' + section.uid}`}>
        <button
          type="button"
          tabIndex={index}
          aria-expanded={activeSections[section.uid]}
          className={activeSections[section.uid] ? 'active' : ''}
          onClick={() => onClickButton(section.uid)}
        >
          {section.label}
          <span className="ff-accordion-icon"></span>
        </button>

        {renderContent(section.uid)}
      </div>
    ));
  }, [props, activeSections, onClickButton, renderContent]);

  return (
    <div className="ff-accordion">
      <div className="field" id={uid}>
        {renderAccordion()}
      </div>
    </div>
  );
}
