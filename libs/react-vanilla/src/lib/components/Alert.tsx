import * as Core from '@formforge/core';
import { useField } from '@formforge/react';

type AlertProps = {
  text: string;
  level?: 'default' | 'info' | 'success' | 'warning' | 'error';
};

export function Alert(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.Field;
  const { uid, props } = useField<AlertProps>(field);

  return (
    <div className="ff-alert">
      <div className="field" id={uid}>
        <div className={`ff-alert-notification ${props.level || 'default'}`}>
          {props.text}
        </div>
      </div>
    </div>
  );
}
