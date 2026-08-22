import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { cn, useLayoutWidget, WidgetRenderer } from '@golemui/react';
import { createIntersectionObserver } from '@golemui/gui-components/internals';
import {
  repeaterIndexSuffix,
  tabButtonId,
  tabPanelId,
  type TabsProps,
} from '@golemui/gui-shared/internals';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export function Tabs(widgetInstance: WithWidget) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widget = widgetInstance.widget as LayoutWidget;
  const { uid, children, templateData, onChange } = useLayoutWidget<TabsProps>(widget);
  const tabRefs = useRef<HTMLButtonElement[]>([]);
  const startSentinelRef = useRef<HTMLLIElement>(null);
  const endSentinelRef = useRef<HTMLLIElement>(null);
  const [isStartVisible, setIsStartVisible] = useState(false);
  const [isEndVisible, setIsEndVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(templateData.defaultOpen);
  // Tab uids come from the props without row indexes, the panel children come from the store with
  // them, so the comparison adds this layout's own suffix.
  const rowIndexSuffix = repeaterIndexSuffix(widget.uid);
  const activeChildUid = `${activeTab ?? ''}${rowIndexSuffix}`;

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
      tabRefs.current[currentIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
      const isRTL = containerRef.current
        ? window.getComputedStyle(containerRef.current).direction === 'rtl'
        : false;

      switch (event.key) {
        case 'ArrowLeft': {
          const nextIndex = currentIndex + (isRTL ? 1 : -1);

          if (nextIndex >= 0 && nextIndex < templateData.tabs.length) {
            handleTabChange(templateData.tabs[nextIndex].uid);
            tabButtons[nextIndex]?.focus();
          }
          break;
        }
        case 'ArrowRight': {
          const nextIndex = currentIndex + (isRTL ? -1 : 1);

          if (nextIndex >= 0 && nextIndex < templateData.tabs.length) {
            handleTabChange(templateData.tabs[nextIndex].uid);
            tabButtons[nextIndex]?.focus();
          }
          break;
        }
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
        <li role="presentation" key={tabButtonId(widget.uid, tab.uid)}>
          <button
            ref={(el) => {
              tabRefs.current[index] = el!;
            }}
            type="button"
            role="tab"
            tabIndex={tab.uid === activeTab ? 0 : -1}
            data-cy={tabButtonId(widget.uid, tab.uid)}
            id={tabButtonId(widget.uid, tab.uid)}
            aria-controls={tabPanelId(widget.uid, tab.uid)}
            aria-selected={tab.uid === activeTab ? 'true' : 'false'}
            className={`${tab.uid === activeTab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.uid)}
            onKeyDown={(event: React.KeyboardEvent) => onKeyDown(event)}
            onFocus={(event: React.FocusEvent) => {
              event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }}
          >
            {tab.label}
          </button>
        </li>
      );
    });
  }, [templateData, activeTab, widget, tabRefs, handleTabChange, onKeyDown]);

  // Panels are built from the tab list, not from the children, so a tab and its panel always
  // carry the same uid. A tab whose child is hidden by a `when` keeps its header and gets no panel.
  const renderWidgets = useCallback(() => {
    const tabs = templateData.tabs || [];

    return tabs.map((tab) => {
      const child = children.find((section) => section.uid === `${tab.uid}${rowIndexSuffix}`);
      const isActive = child?.uid === activeChildUid;

      if (!child || (!isActive && templateData.renderMode === 'activeOnly')) {
        return null;
      }

      return (
        <section
          key={tabPanelId(widget.uid, tab.uid)}
          role="tabpanel"
          tabIndex={0}
          data-cy={tabPanelId(widget.uid, tab.uid)}
          id={tabPanelId(widget.uid, tab.uid)}
          hidden={!isActive}
          aria-labelledby={tabButtonId(widget.uid, tab.uid)}
        >
          <WidgetRenderer key={child.uid} widget={child as NonFunctionWidget<string>} />
        </section>
      );
    });
  }, [children, activeChildUid, widget, templateData, rowIndexSuffix]);

  return (
    <div className="gui-tabs gui-field" style={{ flex: templateData.size }}>
      <nav
        className={cn({
          'gui-widget': true,
          'gui-widget--horizontal': true,
          'gui-tabs--start-shadow': !isStartVisible,
          'gui-tabs--end-shadow': !isEndVisible,
        })}
        id={uid}
      >
        <ul role="tablist">
          <li
            role="presentation"
            ref={startSentinelRef}
            className="gui-sentinel gui-sentinel__start"
          ></li>
          {renderTabs()}
          <li
            role="presentation"
            ref={endSentinelRef}
            className="gui-sentinel gui-sentinel__end"
          ></li>
        </ul>
      </nav>
      {renderWidgets()}
    </div>
  );
}
