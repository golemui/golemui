import * as Core from '@formforge/core';
import { FieldRenderer, useLayout } from '@formforge/react';
import { useCallback } from 'react';
import '../styles.scss';

export function Stack(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.LayoutField;
  const { uid, children, formContext } = useLayout(field);

  const renderFields = useCallback(() => {
    return children.map((field) => (
      <FieldRenderer key={field.uid} field={field} formContext={formContext} />
    ));
  }, [children, formContext]);

  return (
    <ff-stack>
      <div className="field" aria-orientation={field.props?.direction ?? ''} id={uid}>
        {renderFields()}
      </div>
    </ff-stack>
  );
}
