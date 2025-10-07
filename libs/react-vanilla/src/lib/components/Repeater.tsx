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
  const { uid, value, label, formContext } = useControl(field);

  const renderFields = useCallback(() => {
    return value?.map((_, index) => {
      return (
        <RepeaterIndexContext.Provider value={index}>
          <FieldRenderer
            key={`${uid}-${index}`}
            field={field.props?.['template']}
            repeaterIndex={index}
            formContext={formContext}
          />
        </RepeaterIndexContext.Provider>
      );
    });
  }, [field.props, formContext, value, uid]);

  return (
    <div className="field" id={uid}>
      {label && <h2 key={`${uid}-title`}>{label}</h2>}
      {renderFields()}
    </div>
  );
}
