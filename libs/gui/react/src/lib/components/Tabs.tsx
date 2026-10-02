import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/react';
import type { GuiTabChangeEventDetail } from '@golemui/gui-components';
import {
  repeaterIndexSuffix,
  tabButtonId,
  tabPanelId,
  type TabsProps,
} from '@golemui/gui-shared/internals';
import { useEffect, useState } from 'react';
import { GuiTabsReact } from '../web-components';

export function Tabs(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as LayoutWidget;
  const { uid, children, templateData, onChange } = useLayoutWidget<TabsProps>(widget);
  const tabs = templateData.tabs ?? [];
  const [activeTab, setActiveTab] = useState(templateData.defaultOpen ?? tabs[0]?.uid);
  // Tab uids come from the props without row indexes, the panel children come from the store with
  // them, so the lookup adds this layout's own suffix.
  const rowIndexSuffix = repeaterIndexSuffix(widget.uid);

  useEffect(() => {
    if (templateData.defaultOpen) setActiveTab(templateData.defaultOpen);
  }, [templateData.defaultOpen]);

  const onTabChange = (event: CustomEvent<GuiTabChangeEventDetail>) => {
    // A tab set nested in a panel fires its own.
    if (event.target !== event.currentTarget) return;
    setActiveTab(event.detail.value);
    onChange(event.detail.value);
  };

  return (
    <div className="gui-tabs gui-field">
      {/* The parts are plain tags, not React wrappers: a server render then has their attributes,
          such as the inactive panels' hidden. */}
      <GuiTabsReact id={uid} active={activeTab} onGuiTabChange={onTabChange}>
        <gui-tab-list>
          {tabs.map((tab) => (
            <gui-tab
              key={tab.uid}
              panel={tab.uid}
              id={tabButtonId(widget.uid, tab.uid)}
              data-cy={tabButtonId(widget.uid, tab.uid)}
            >
              {tab.label}
            </gui-tab>
          ))}
        </gui-tab-list>
        {/* Panels come from the tab list, so a tab and its panel always carry the same uid. A tab
            whose child is hidden by a `when` keeps its header and gets no panel. */}
        {tabs.map((tab) => {
          const child = children.find((section) => section.uid === `${tab.uid}${rowIndexSuffix}`);
          const isActive = tab.uid === (activeTab ?? tabs[0]?.uid);
          if (!child || (!isActive && templateData.renderMode === 'activeOnly')) return null;

          return (
            <gui-tab-panel
              key={tab.uid}
              name={tab.uid}
              id={tabPanelId(widget.uid, tab.uid)}
              data-cy={tabPanelId(widget.uid, tab.uid)}
              hidden={isActive ? undefined : true}
            >
              <WidgetRenderer widget={child as NonFunctionWidget<string>} />
            </gui-tab-panel>
          );
        })}
      </GuiTabsReact>
    </div>
  );
}
