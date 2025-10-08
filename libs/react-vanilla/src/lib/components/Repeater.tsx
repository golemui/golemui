import * as Core from '@formforge/core';
import {
  FieldRenderer,
  RepeaterIndexContext,
  useControl,
} from '@formforge/react';
import { useCallback } from 'react';
import '../styles.scss';

export function Repeater(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<
    Record<string, unknown>[]
  >;
  const { uid, value, label, formContext, onValueChanged } = useControl(field);

  const addItem = useCallback((value: Record<string, unknown>[]) => {
    const newValue = [...value ?? [], {}];
    onValueChanged(newValue);
  }, [onValueChanged]);

  const removeItem = useCallback(
    (value: Record<string, unknown>[], index: number) => {
      const arr = [...value ?? []]
      arr.splice(index, 1);
      onValueChanged(arr);
    },
    [onValueChanged]
  );

  const renderFields = useCallback(() => {
    return value?.map((_, index) => {
      return (
        <RepeaterIndexContext.Provider value={index}>
          <FieldRenderer
            key={`${uid}-${index}`}
            field={field.props?.template}
            repeaterIndex={index}
            formContext={formContext}
          />
          <button type="button" onClick={() => removeItem(value, index)}>{field.props?.removeLabel ?? 'Remove'}</button>
        </RepeaterIndexContext.Provider>
      );
    });
  }, [field.props, formContext, value, uid]);

  return (
    <div className="field" id={uid}>
      {label && <h2 key={`${uid}-title`}>{label}</h2>}
      {renderFields()}
      <button type="button" onClick={() => addItem(value)}>{field.props?.addLabel ?? 'Add'}</button>
    </div>
  );
}
