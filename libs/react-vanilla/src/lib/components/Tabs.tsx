import * as Core from '@golemui/core';
import { cn, FieldRenderer, useLayoutField } from '@golemui/react';
import { createIntersectionObserver, TabsProps } from '@golemui/shared-vanilla';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export function Tabs(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.LayoutField;
  const { uid, children, props, onChange } = useLayoutField<TabsProps>(field);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const startSentinelRef = useRef<HTMLLIElement>(null);
  const endSentinelRef = useRef<HTMLLIElement>(null);
  const [isStartVisible, setIsStartVisible] = useState(false);
  const [isEndVisible, setIsEndVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(props.defaultOpen ?? props.tabs[0].uid);

  useEffect(() => {
    const startSentinel = startSentinelRef.current;
    const endSentinel = endSentinelRef.current;

    const startObserver = createIntersectionObserver(startSentinel!, (isIntersecting) =>
      setIsStartVisible(isIntersecting),
    );
    const endObserver = createIntersectionObserver(endSentinel!, (isIntersecting) =>
      setIsEndVisible(isIntersecting),
    );

    return () => {
      startObserver.disconnect();
      endObserver.disconnect();
    };
  }, []);

  const handleTabChange = (uid: string) => {
    setActiveTab(uid);
    onChange(uid);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const currentIndex = props.tabs.findIndex((tab) => tab.uid === activeTab);
    const tabButtons = tabRefs.current;

    switch (event.key) {
      case 'ArrowLeft':
        if (currentIndex > 0) {
          handleTabChange(props.tabs[currentIndex - 1].uid);
          tabButtons[currentIndex - 1]?.focus();
        }
        break;
      case 'ArrowRight':
        if (currentIndex < props.tabs.length - 1) {
          handleTabChange(props.tabs[currentIndex + 1].uid);
          tabButtons[currentIndex + 1]?.focus();
        }
        break;
      case 'Home':
        handleTabChange(props.tabs[0].uid);
        tabButtons[0]?.focus();
        break;
      case 'End':
        handleTabChange(props.tabs[props.tabs.length - 1].uid);
        tabButtons[props.tabs.length - 1]?.focus();
        break;
      default:
        return;
    }
  };

  const renderTabs = useCallback(() => {
    return props.tabs.map((tab, index) => {
      return (
        <li>
          <button
            key={`tab_${field.uid}_${tab.uid}`}
            ref={(el) => {
              tabRefs.current[index] = el!;
            }}
            type="button"
            role="tab"
            tabIndex={tab.uid === activeTab ? undefined : -1}
            data-cy={`tab_${field.uid}_${index}`}
            id={`tab_${field.uid}_${index}`}
            aria-controls={`tabpanel_${field.uid}_${index}`}
            aria-selected={tab.uid === activeTab ? 'true' : 'false'}
            className={`${tab.uid === activeTab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.uid)}
            onKeyDown={(event: React.KeyboardEvent) => onKeyDown(event)}
            onFocus={(event: React.FocusEvent) => {
              event.target.scrollIntoView();
            }}
          >
            {tab.label}
          </button>
        </li>
      );
    });
  }, [props, activeTab]);

  const renderFields = useCallback(() => {
    const activeSectionIndex = children.findIndex((section: any) => section.uid === activeTab);

    return children
      .filter((field) => field.uid === activeTab)
      .map((section) => (
        <section
          key={`tabpanel_${field.uid}_${section.uid}`}
          role="tabpanel"
          tabIndex={0}
          data-cy={`tabpanel_${field.uid}_${activeSectionIndex}`}
          id={`tabpanel_${field.uid}_${activeSectionIndex}`}
          aria-labelledby={`tab_${field.uid}_${activeSectionIndex}`}
        >
          <FieldRenderer key={section.uid} field={section} />
        </section>
      ));
  }, [children, activeTab, field]);

  return (
    <div className="gui-tabs">
      <nav
        className={cn({
          'gui-field': true,
          'gui-field--horizontal': true,
          'gui-tabs--start-shadow': !isStartVisible,
          'gui-tabs--end-shadow': !isEndVisible,
        })}
        role="tablist"
        id={uid}
      >
        <ul>
          <li role="presentation" ref={startSentinelRef} className="gui-sentinel"></li>
          {renderTabs()}
          <li role="presentation" ref={endSentinelRef} className="gui-sentinel"></li>
        </ul>
      </nav>
      {renderFields()}
    </div>
  );
}
