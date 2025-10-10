import * as Core from '@formforge/core';
import { FieldRenderer, useLayout } from '@formforge/react';
import { useCallback } from 'react';
import '../styles.scss';

type StackProps = {
  direction?: 'horizontal' | 'vertical';
};

export function Stack(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.LayoutField;
  const { uid, children, formContext, props } = useLayout<StackProps>(field);

  const renderFields = useCallback(() => {
    return children.map((field) => (
      <FieldRenderer key={field.uid} field={field} formContext={formContext} />
    ));
  }, [children, formContext]);

  const direction = props.direction || 'vertical';
  return (
    <div className="ff-stack">
      <div className={`field ${direction}`} id={uid}>
        {renderFields()}
      </div>
    </div>
  );
}
