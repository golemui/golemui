import * as Core from '@golemui/core';
import { useDisplayField } from '@golemui/react';
import { createElement, PropsWithChildren } from 'react';
import styles from './heading.component.module.scss';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

export function HeadingComponent(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.DisplayField;
  const { uid, props } = useDisplayField<OwnWidgetProps>(field);

  return (
    <div className="gui-field" id={uid} data-cy="heading">
      <DynamicHeading level={props.level || 1}>{props.text}</DynamicHeading>
    </div>
  );
}

function DynamicHeading({ level, children }: PropsWithChildren<{ level: number }>) {
  const HeadingTag = `h${level}`;

  return createElement(HeadingTag, { className: styles.heading }, children);
}

export default HeadingComponent;
