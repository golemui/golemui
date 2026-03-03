import * as Core from '@golemui/core';
import { useDisplayWdiget } from '@golemui/react';
import { createElement, PropsWithChildren } from 'react';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

export function HeadingComponent(fieldInstance: Core.WithWidget) {
  const field = fieldInstance.widget as Core.DisplayWidget;
  const { uid, templateData } = useDisplayWdiget<OwnWidgetProps>(field);

  return (
    <div className="gui-widget" id={uid} data-cy="heading">
      <DynamicHeading level={templateData.level || 1}>{templateData.text}</DynamicHeading>
    </div>
  );
}

function DynamicHeading({ level, children }: PropsWithChildren<{ level: number }>) {
  const HeadingTag = `h${level}`;

  return createElement(HeadingTag, { className: 'heading' }, children);
}

export default HeadingComponent;
