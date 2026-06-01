import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { createElement, type PropsWithChildren } from 'react';
import styles from './heading.component.module.scss';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

export function HeadingComponent(fieldInstance: WithWidget) {
  const field = fieldInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWdiget<OwnWidgetProps>(field);

  return (
    <div className="gui-widget" id={uid}>
      <DynamicHeading level={templateData.level || 1}>{templateData.text}</DynamicHeading>
    </div>
  );
}

function DynamicHeading({ level, children }: PropsWithChildren<{ level: number }>) {
  const HeadingTag = `h${level}`;

  return createElement(HeadingTag, { className: styles.heading }, children);
}

export default HeadingComponent;
