import * as Core from '@golemui/core';
import { FieldRenderer, useLayoutField } from '@golemui/react';
import { TabsProps } from '@golemui/shared-vanilla';
import React, { useCallback, useRef, useState } from 'react';

export function Tabs(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.LayoutField;
  const { uid, children, props } = useLayoutField<TabsProps>(field);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const [activeTab, setActiveTab] = useState(props.defaultOpen ?? props.tabs[0].uid);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const currentIndex = props.tabs.findIndex((tab) => tab.uid === activeTab);
    const tabButtons = tabRefs.current;

    switch (event.key) {
      case 'ArrowLeft':
        if (currentIndex > 0) {
          setActiveTab(props.tabs[currentIndex - 1].uid);
          tabButtons[currentIndex - 1]?.focus();
        }
        break;
      case 'ArrowRight':
        if (currentIndex < props.tabs.length - 1) {
          setActiveTab(props.tabs[currentIndex + 1].uid);
          tabButtons[currentIndex + 1]?.focus();
        }
        break;
      case 'Home':
        setActiveTab(props.tabs[0].uid);
        tabButtons[0]?.focus();
        break;
      case 'End':
        setActiveTab(props.tabs[props.tabs.length - 1].uid);
        tabButtons[props.tabs.length - 1]?.focus();
        break;
      default:
        return;
    }
  };

  const renderTabs = useCallback(() => {
    return props.tabs.map((tab, index) => {
      return (
        <button
          key={`tab_${field.uid}_${tab.uid}`}
          ref={(el) => {
            tabRefs.current[index] = el!;
          }}
          type="button"
          role="tab"
          tabIndex={tab.uid === activeTab ? undefined : -1}
          id={`tab_${field.uid}_${index}`}
          aria-controls={`tabpanel_${field.uid}_${index}`}
          aria-selected={tab.uid === activeTab ? 'true' : 'false'}
          className={`${tab.uid === activeTab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.uid)}
          onKeyDown={(event: React.KeyboardEvent) => onKeyDown(event)}
        >
          {tab.label}
        </button>
      );
    });
  }, [props, activeTab]);

  const renderFields = useCallback(() => {
    return children
      .filter((field) => field.uid === activeTab)
      .map((field, index) => (
        <section
          key={`tabpanel_${field.uid}_${field.uid}`}
          role="tabpanel"
          tabIndex={0}
          id={`tabpanel_${field.uid}_${index}`}
          aria-labelledby={`tab_${field.uid}_${index}`}
        >
          <FieldRenderer key={field.uid} field={field} />
        </section>
      ));
  }, [children, activeTab]);

  return (
    <div className="gui-tabs">
      <nav className={`gui-field gui-field--horizontal`} role="tablist" id={uid}>
        {renderTabs()}
      </nav>
      <section role="tabpanel">{renderFields()}</section>
    </div>
  );
}
