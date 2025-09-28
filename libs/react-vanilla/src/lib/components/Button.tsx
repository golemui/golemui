import * as Core from '@formforge/core';
import { useButton } from '@formforge/react';
import '../styles.scss';

export function Button(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ButtonField;
  const { uid, isDisabled, label, onClick } = useButton(field);

  return (
    <div className="field">
      <button type="button" id={uid} onClick={onClick} disabled={isDisabled}>
        {label}
      </button>
    </div>
  );
}
