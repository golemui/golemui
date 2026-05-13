import * as Core from '@golemui/core';
import { getItemKey, RepeaterProps } from '@golemui/gui-shared';
import {
  RepeaterIndexesContext,
  useInputWidget,
  useRepeaterIndexes,
  WidgetRenderer,
} from '@golemui/react';
import React, { useCallback, useRef, useState } from 'react';
import '../styles.scss';

/**
 * Monotonically increasing counter for generating unique repeater item IDs.
 */
let nextRepeaterItemId = 0;
const idIncrementer = () => nextRepeaterItemId++;

export function Repeater(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<Record<string, unknown>[]>;
  const { uid, value, onValueChanged, templateData, errors, isTouched, onBlur } = useInputWidget<
    Record<string, unknown>[],
    RepeaterProps<any>
  >(widget);

  const repeaterRef = useRef<HTMLDivElement>(null);

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
    onBlur();
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
                className="gui-button gui-button--sm gui-repeater__remove-btn"
                onClick={() => removeItem(value, index)}
              >
                {templateData.removeButtonIcon && (
                  <span
                    className={`gui-widget-icon gui-button-icon ${templateData.removeButtonIcon}`}
                    data-icon={templateData.removeButtonIcon}
                  ></span>
                )}
                {templateData.removeLabel ?? 'Remove'}
              </button>
            </div>
            <WidgetRenderer key={`${uid}-${itemKey}`} widget={templateData.template} />
          </div>
        </RepeaterIndexesContext.Provider>
      );
    });
  }, [templateData, value, uid, removeItem, repeaterIndexesFromContext]);

  const isRequired = (templateData.validator as Core.Validator)?.required;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-repeater gui-field" style={{ flex: templateData.size }}>
      <div
        ref={repeaterRef}
        id={uid}
        className={`gui-repeater__main-card gui-repeater__card${isFocused ? ' gui-repeater__card--focused' : ''}`}
        onFocus={onFocusIn}
        onBlur={onFocusOut}
      >
        <gui-label
          targetElement={repeaterRef.current || undefined}
          uid={uid}
          label={templateData.label as string}
          errors={errors}
          touched={isTouched}
          required={isRequired}
          native={false}
        ></gui-label>

        {renderWidgets()}
        <button
          type="button"
          className="gui-button gui-repeater__add-btn"
          onClick={() => addItem(value || [])}
          disabled={templateData.limit ? templateData.limit === (value?.length ?? 0) : false}
        >
          {templateData.addButtonIcon && (
            <span
              className={`gui-widget-icon gui-button-icon ${templateData.addButtonIcon}`}
              data-icon={templateData.addButtonIcon}
            ></span>
          )}
          {templateData.addLabel ?? 'Add'}
        </button>
      </div>

      {showErrors && <gui-errors uid={uid} errors={errors} touched={isTouched}></gui-errors>}
    </div>
  );
}
