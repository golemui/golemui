import * as Core from '@formforge/core';
import { FieldRenderer, useLayout } from '@formforge/react';
import { useCallback, useState } from 'react';

type TabsProps = {
  defaultOpen?: string;
  tabs: { label: string; uid: string }[];
};

export function Tabs(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.LayoutField;
  const { uid, children, formContext, props } = useLayout<TabsProps>(field);
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
      .map((field) => <FieldRenderer key={field.uid} field={field} formContext={formContext} />);
  }, [children, formContext, activeTab]);

  return (
    <div className="ff-tabs">
      <nav className={`field horizontal`} role="tablist" id={uid}>
        {renderTabs()}
      </nav>
      <section className="field" role="tabpanel">
        {renderFields()}
      </section>
    </div>
  );
}
