import * as Core from '@formforge/core';
import { useInteractive } from '@formforge/react';
import '../styles.scss';

export function Button(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.InteractiveField;
  const { uid, isDisabled, label, onClick } = useInteractive(field);

  return (
    <div className="ff-button">
      <div className="ff-field">
        <button type="button" id={uid} onClick={onClick} disabled={isDisabled}>
          {label}
        </button>
      </div>
    </div>
  );
}
