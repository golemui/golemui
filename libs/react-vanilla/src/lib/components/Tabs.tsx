import * as Core from '@golemui/core';
import { cn, useLayoutWidget, WidgetRenderer } from '@golemui/react';
import { createIntersectionObserver, TabsProps } from '@golemui/shared-vanilla';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export function Tabs(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.LayoutWidget;
  const { uid, children, templateData, onChange } = useLayoutWidget<TabsProps>(widget);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const startSentinelRef = useRef<HTMLLIElement>(null);
  const endSentinelRef = useRef<HTMLLIElement>(null);
  const [isStartVisible, setIsStartVisible] = useState(false);
  const [isEndVisible, setIsEndVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(templateData.defaultOpen);

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

  useEffect(() => {
    if (activeTab === undefined && templateData.tabs?.length > 0) {
      setActiveTab(templateData.tabs[0].uid);
    }
  }, [templateData.tabs, activeTab]);

  useEffect(() => {
    if (templateData.defaultOpen) {
      setActiveTab(templateData.defaultOpen);
    }
  }, [templateData.defaultOpen]);

  useEffect(() => {
    const tabs = templateData.tabs || [];
    const currentIndex = tabs.findIndex((tab) => tab.uid === activeTab);
    if (currentIndex > -1) {
      tabRefs.current[currentIndex].scrollIntoView();
    }
  }, [activeTab, templateData.tabs]);

  const handleTabChange = useCallback(
    (uid: string) => {
      setActiveTab(uid);
      onChange(uid);
    },
    [onChange],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const currentIndex = templateData.tabs.findIndex((tab) => tab.uid === activeTab);
      const tabButtons = tabRefs.current;

      switch (event.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) {
            handleTabChange(templateData.tabs[currentIndex - 1].uid);
            tabButtons[currentIndex - 1]?.focus();
          }
          break;
        case 'ArrowRight':
          if (currentIndex < templateData.tabs.length - 1) {
            handleTabChange(templateData.tabs[currentIndex + 1].uid);
            tabButtons[currentIndex + 1]?.focus();
          }
          break;
        case 'Home':
          handleTabChange(templateData.tabs[0].uid);
          tabButtons[0]?.focus();
          break;
        case 'End':
          handleTabChange(templateData.tabs[templateData.tabs.length - 1].uid);
          tabButtons[templateData.tabs.length - 1]?.focus();
          break;
        default:
          return;
      }
    },
    [activeTab, templateData.tabs, handleTabChange],
  );

  const renderTabs = useCallback(() => {
    const tabs = templateData.tabs || [];
    return tabs.map((tab, index) => {
      return (
        <li key={`tab_${widget.uid}_${tab.uid}`}>
          <button
            ref={(el) => {
              tabRefs.current[index] = el!;
            }}
            type="button"
            role="tab"
            tabIndex={tab.uid === activeTab ? undefined : -1}
            data-cy={`tab_${widget.uid}_${index}`}
            id={`tab_${widget.uid}_${index}`}
            aria-controls={`tabpanel_${widget.uid}_${index}`}
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
  }, [templateData, activeTab, widget, tabRefs, handleTabChange, onKeyDown]);

  const renderWidgets = useCallback(() => {
    const activeSectionIndex = children.findIndex((section: any) => section.uid === activeTab);

    return children
      .filter((widget) => widget.uid === activeTab || templateData.renderMode !== 'activeOnly')
      .map((section) => (
        <section
          key={`tabpanel_${widget.uid}_${section.uid}`}
          role="tabpanel"
          tabIndex={0}
          data-cy={`tabpanel_${widget.uid}_${activeSectionIndex}`}
          id={`tabpanel_${widget.uid}_${activeSectionIndex}`}
          hidden={section.uid !== activeTab && templateData.renderMode !== 'activeOnly'}
          aria-labelledby={`tab_${widget.uid}_${activeSectionIndex}`}
        >
          <WidgetRenderer key={section.uid} widget={section as Core.NonFunctionWidget<string>} />
        </section>
      ));
  }, [children, activeTab, widget]);

  return (
    <div className="gui-tabs" style={{ flex: templateData.size }}>
      <nav
        className={cn({
          'gui-widget': true,
          'gui-widget--horizontal': true,
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
      {renderWidgets()}
    </div>
  );
}
