import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import { createElement, type PropsWithChildren } from 'react';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

export function HeadingComponent(fieldInstance: WithWidget) {
  const field = fieldInstance.widget as DisplayWidget;
  const { uid, templateData } = useDisplayWidget<OwnWidgetProps>(field);

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
