import * as Core from '@formforge/core';
import { useDisplay } from '@formforge/react';
import { AlertProps } from '@formforge/shared-vanilla';

export function Alert(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.DisplayField;
  const { uid, props } = useDisplay<AlertProps>(field);

  return (
    <div className="ff-alert">
      <div className="ff-field" id={uid}>
        <div className={`ff-alert-notification ff-alert-notification--${props.level || 'default'}`}>
          {props.text}
        </div>
      </div>
    </div>
  );
}
