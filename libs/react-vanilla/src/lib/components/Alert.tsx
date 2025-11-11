import * as Core from '@golemui/core';
import { useDisplay } from '@golemui/react';
import { AlertProps } from '@golemui/shared-vanilla';

export function Alert(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.DisplayField;
  const { uid, props } = useDisplay<AlertProps>(field);

  return (
    <div className="gui-alert">
      <div className="gui-field" id={uid}>
        <div
          className={`gui-alert-notification gui-alert-notification--${props.level || 'default'}`}
        >
          {props.text}
        </div>
      </div>
    </div>
  );
}
