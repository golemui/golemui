import * as Core from '@golemui/core';
import { useDisplayField } from '@golemui/react';
import { AlertProps } from '@golemui/shared-vanilla';

export function Alert(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.DisplayField;
  const { uid, templateData } = useDisplayField<AlertProps>(field);

  return (
    <div className="gui-alert">
      <div className="gui-field" id={uid}>
        <div
          role="alert"
          className={`gui-alert-notification gui-alert-notification--${templateData.level || 'default'}`}
        >
          {templateData.text}
        </div>
      </div>
    </div>
  );
}
