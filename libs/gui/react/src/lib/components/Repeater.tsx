import * as Core from '@golemui/core';
import {
  RepeaterIndexesContext,
  useInputWidget,
  useRepeaterIndexes,
  WidgetRenderer,
} from '@golemui/react';
import { RepeaterProps, getItemKey } from '@golemui/gui-shared';
import { useCallback, useState } from 'react';
import '../styles.scss';

/**
 * Monotonically increasing counter for generating unique repeater item IDs.
 */
let nextRepeaterItemId = 0;
const idIncrementer = () => nextRepeaterItemId++;

export function Repeater(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<Record<string, unknown>[]>;
  const { uid, value, onValueChanged, templateData, errors, isTouched } = useInputWidget<
    Record<string, unknown>[],
    RepeaterProps<any>
  >(widget);

  const addItem = useCallback(
    (value: Record<string, unknown>[]) => {
      const newValue = [...(value ?? []), {}];
      onValueChanged(newValue);
    },
    [onValueChanged],
  );

  const removeItem = useCallback(
    (value: Record<string, unknown>[], index: number) => {
      const items = (value ?? []).filter((_, i) => index !== i);
      // Make sure we don't keep object references
      if ('structuredClone' in window) {
        onValueChanged(structuredClone(items));
      } else {
        onValueChanged(JSON.parse(JSON.stringify(items)));
      }
    },
    [onValueChanged],
  );

  const [isFocused, setIsFocused] = useState(false);

  const onFocusIn = useCallback((event: React.FocusEvent) => {
    event.stopPropagation();
    setIsFocused(true);
  }, []);

  const onFocusOut = useCallback((event: React.FocusEvent) => {
    event.stopPropagation();
    setIsFocused(false);
  }, []);

  const repeaterIndexesFromContext = useRepeaterIndexes();

  const renderWidgets = useCallback(() => {
    return value?.map((item, index) => {
      const itemKey = getItemKey(item, idIncrementer);
      return (
        <RepeaterIndexesContext.Provider
          value={[...repeaterIndexesFromContext, index]}
          key={`${uid}-${itemKey}`}
        >
          <div className="gui-repeater__card">
            <div className="gui-repeater__card-header">
              {templateData.title && (
                <span className="gui-repeater__card-title">{`${templateData.title} ${index + 1}`}</span>
              )}
              <button
                type="button"
                className="gui-button gui-repeater__remove-btn"
                onClick={() => removeItem(value, index)}
              >
                {templateData.removeButtonIcon && (
                  <span className={`gui-button-icon ${templateData.removeButtonIcon}`}></span>
                )}
                {templateData.removeLabel ?? 'Remove'}
              </button>
            </div>
            <WidgetRenderer
              key={`${uid}-${itemKey}`}
              widget={templateData.template}
              repeaterIndex={index}
            />
          </div>
        </RepeaterIndexesContext.Provider>
      );
    });
  }, [templateData, value, uid, removeItem, repeaterIndexesFromContext]);

  return (
    <div className="gui-repeater" style={{ flex: templateData.size }}>
      <div
        id={uid}
        className={`gui-repeater__card${isFocused ? ' gui-repeater__card--focused' : ''}`}
        onFocus={onFocusIn}
        onBlur={onFocusOut}
      >
        {templateData.label && <h2 key={`${uid}-title`}>{templateData.label as string}</h2>}
        {isTouched && errors && errors.length > 0 && (
          <ul className="gui-validator" id={`${uid}_errors`} data-cy={`${uid}_validator-errors`}>
            {errors.map((error: string, index: number) => (
              <li
                key={index}
                className="gui-validator__error"
                role="alert"
                data-cy={`${uid}_validator-error`}
              >
                {error}
              </li>
            ))}
          </ul>
        )}
        {renderWidgets()}
        <button
          type="button"
          className="gui-button gui-repeater__add-btn"
          onClick={() => addItem(value || [])}
          disabled={templateData.limit ? templateData.limit === (value?.length ?? 0) : false}
        >
          {templateData.addButtonIcon && (
            <span className={`gui-button-icon ${templateData.addButtonIcon}`}></span>
          )}
          {templateData.addLabel ?? 'Add'}
        </button>
      </div>
    </div>
  );
}
