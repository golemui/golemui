import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { createElement, type PropsWithChildren } from 'react';

type HeadingWidgetProps = {
  text: string;
  level?: number;
};

export function HeadingComponent(fieldInstance: WithWidget) {
  const field = fieldInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWdiget<HeadingWidgetProps>(field);

  return (
    <div id={uid}>
      <DynamicHeading level={templateData.level || 1}>{templateData.text}</DynamicHeading>
    </div>
  );
}

function DynamicHeading({ level, children }: PropsWithChildren<{ level: number }>) {
  return createElement(`h${level}`, null, children);
}
