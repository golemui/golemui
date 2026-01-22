import * as Core from '@golemui/core';
import { FieldRenderer, RepeaterIndexContext, useControlField } from '@golemui/react';
import { RepeaterProps } from '@golemui/shared-vanilla';
import { useCallback } from 'react';
import '../styles.scss';

export function Repeater(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<Record<string, unknown>[]>;
  const { uid, value, onValueChanged, templateData } = useControlField<
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
              field={templateData.template}
              repeaterIndex={index}
            />
            <button type="button" className="gui-button" onClick={() => removeItem(value, index)}>
              {templateData.removeLabel ?? 'Remove'}
            </button>
          </div>
        </RepeaterIndexContext.Provider>
      );
    });
  }, [templateData, value, uid, removeItem]);

  return (
    <div className="gui-repeater" style={{ flex: templateData.size }}>
      <div id={uid}>
        {templateData.label && <h2 key={`${uid}-title`}>{templateData.label as string}</h2>}
        {renderFields()}
        <button
          type="button"
          className="gui-button"
          onClick={() => addItem(value || [])}
          disabled={templateData.limit ? templateData.limit === (value?.length ?? 0) : false}
        >
          {templateData.addLabel ?? 'Add'}
        </button>
      </div>
    </div>
  );
}
