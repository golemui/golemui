import * as Core from '@golemui/core';
import { FieldRenderer, RepeaterIndexContext, useControl } from '@golemui/react';
import { useCallback } from 'react';
import '../styles.scss';
import { RepeaterProps } from '@golemui/shared-vanilla';

export function Repeater(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<Record<string, unknown>[]>;
  const { uid, value, label, formContext, onValueChanged, props } = useControl<
    Record<string, unknown>[],
    RepeaterProps
  >(field);

  const addItem = useCallback(
    (value: Record<string, unknown>[]) => {
      const newValue = [...(value ?? []), {}];
      onValueChanged(newValue);
    },
    [onValueChanged],
  );

  const removeItem = useCallback(
    (value: Record<string, unknown>[], index: number) => {
      const arr = [...(value ?? [])];
      arr.splice(index, 1);
      onValueChanged(arr);
    },
    [onValueChanged],
  );

  const renderFields = useCallback(() => {
    return value?.map((_, index) => {
      return (
        <RepeaterIndexContext.Provider value={index} key={`${uid}-${index}`}>
          <div className={'card'}>
            <FieldRenderer
              key={`${uid}-${index}`}
              field={props.template}
              repeaterIndex={index}
              formContext={formContext}
            />
            <button type="button" className="gui-button" onClick={() => removeItem(value, index)}>
              {props.removeLabel ?? 'Remove'}
            </button>
          </div>
        </RepeaterIndexContext.Provider>
      );
    });
  }, [props, formContext, value, uid, removeItem]);

  return (
    <div className="gui-repeater">
      <div id={uid}>
        {label && <h2 key={`${uid}-title`}>{label}</h2>}
        {renderFields()}
        <button
          type="button"
          className="gui-button"
          onClick={() => addItem(value || [])}
          disabled={props.limit ? props.limit === (value?.length ?? 0) : false}
        >
          {props.addLabel ?? 'Add'}
        </button>
      </div>
    </div>
  );
}
