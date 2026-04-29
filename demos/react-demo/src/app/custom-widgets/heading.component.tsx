import * as Core from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { createElement, PropsWithChildren } from 'react';

type HeadingWidgetProps = {
  text: string;
  level?: number;
};

export function HeadingComponent(fieldInstance: Core.WithWidget) {
  const field = fieldInstance.widget as Core.DisplayWidget;
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
