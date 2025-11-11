import * as Core from '@golemui/core';
import { useInteractive } from '@golemui/react';
import '../styles.scss';

export function Button(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.InteractiveField;
  const { uid, isDisabled, label, onClick } = useInteractive(field);

  return (
    <div className="gui-button">
      <div className="gui-field">
        <button type="button" id={uid} onClick={onClick} disabled={isDisabled}>
          {label}
        </button>
      </div>
    </div>
  );
}
