import * as Core from '@formforge/core';
import { useField } from '@formforge/react';
import { createElement, PropsWithChildren } from 'react';
import styles from './heading.component.module.scss';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

export function HeadingComponent(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.Field;
  const { uid, props } = useField<OwnWidgetProps>(field);

  return (
    <div className="field" id={uid}>
      <DynamicHeading level={props.level || 1}>{props.text}</DynamicHeading>
    </div>
  );
}

function DynamicHeading({ level, children }: PropsWithChildren<{ level: number }>) {
  const HeadingTag = `h${level}`;

  return createElement(HeadingTag, { className: styles.heading }, children);
}

export default HeadingComponent;
