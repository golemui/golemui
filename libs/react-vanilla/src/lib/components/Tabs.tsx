import * as Core from '@golemui/core';
import { FieldRenderer, useLayoutField } from '@golemui/react';
import { TabsProps } from '@golemui/shared-vanilla';
import { useCallback, useState } from 'react';

export function Tabs(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.LayoutField;
  const { uid, children, props } = useLayoutField<TabsProps>(field);
  const [activeTab, setActiveTab] = useState(props.defaultOpen ?? props.tabs[0].uid);

  const renderTabs = useCallback(() => {
    return props.tabs.map((tab, index) => (
      <a
        role="tab"
        key={`${'tab-' + tab.uid}`}
        tabIndex={index}
        className={`${tab.uid === activeTab ? 'active' : ''}`}
        onClick={() => setActiveTab(tab.uid)}
        onKeyDown={() => setActiveTab(tab.uid)}
      >
        {tab.label}
      </a>
    ));
  }, [props, activeTab]);

  const renderFields = useCallback(() => {
    return children
      .filter((field) => field.uid === activeTab)
      .map((field) => <FieldRenderer key={field.uid} field={field} />);
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
