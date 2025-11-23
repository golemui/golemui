import * as Core from '@golemui/core';
import { FieldRenderer, useLayoutField } from '@golemui/react';
import { StackProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Stack(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.LayoutField;
  const { uid, children, props } = useLayoutField<StackProps>(field);

  const renderFields = useCallback(() => {
    return children.map((field) => <FieldRenderer key={field.uid} field={field} />);
  }, [children]);

  const direction = props.direction === 'horizontal' ? 'gui-field--horizontal' : '';
  return (
    <div className="gui-stack">
      <div className={`gui-field ${direction}`} id={uid}>
        {renderFields()}
      </div>
    </div>
  );
}
