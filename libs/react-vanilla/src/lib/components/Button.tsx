import * as Core from '@golemui/core';
import { useInteractiveField } from '@golemui/react';
import '../styles.scss';

export function Button(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.InteractiveField;
  const { uid, isDisabled, templateData, onClick } = useInteractiveField(field);

  return (
    <div className="gui-button">
      <div className="gui-field">
        <button
          type="button"
          id={uid}
          data-cy={`${uid}_button`}
          onClick={onClick}
          disabled={isDisabled}
        >
          {templateData.label as string}
        </button>
      </div>
    </div>
  );
}
