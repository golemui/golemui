import * as Core from '@golemui/core';
import { useDisplayField } from '@golemui/react';
import { createElement, PropsWithChildren } from 'react';
import styles from './heading.component.module.scss';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

export function HeadingComponent(fieldInstance: Core.WithWidget) {
  const field = fieldInstance.widget as Core.DisplayWidget;
  const { uid, templateData } = useDisplayField<OwnWidgetProps>(field);

  return (
    <div className="gui-field" id={uid}>
      <DynamicHeading level={templateData.level || 1}>{templateData.text}</DynamicHeading>
    </div>
  );
}

function DynamicHeading({ level, children }: PropsWithChildren<{ level: number }>) {
  const HeadingTag = `h${level}`;

  return createElement(HeadingTag, { className: styles.heading }, children);
}

export default HeadingComponent;
