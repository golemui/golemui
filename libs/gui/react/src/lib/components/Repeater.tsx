import { GuiErrorsReact, GuiLabelReact } from '../web-components';
import type { FormWidget, InputWidget, Validator, WithWidget } from '@golemui/core';
import {
  findRepeaterRowFocus,
  focusAfterRowRemoval,
  type RepeaterProps,
  type RepeaterRowFocus,
} from '@golemui/gui-shared/internals';
import { useInputWidget, WidgetRenderer } from '@golemui/react';
import React, { Component, type RefObject, useCallback, useRef, useState } from 'react';
import '../styles.scss';

interface FocusAfterRowRemovalProps {
  repeaterRef: RefObject<HTMLDivElement | null>;
  /** The number of rows that this render shows. */
  rowCount: number;
}

/**
 * Moves the focus when an update removes the row that has it. A class component, because
 * `getSnapshotBeforeUpdate` is the only React method that runs before React changes the DOM.
 * It renders nothing and updates every time the repeater renders.
 */
class FocusAfterRowRemoval extends Component<
  FocusAfterRowRemovalProps,
  object,
  RepeaterRowFocus | null
> {
  public getSnapshotBeforeUpdate(): RepeaterRowFocus | null {
    return findRepeaterRowFocus(this.props.repeaterRef.current, this.props.rowCount);
  }

  public componentDidUpdate(
    _previousProps: FocusAfterRowRemovalProps,
    _previousState: object,
    rowFocus: RepeaterRowFocus | null,
  ) {
    focusAfterRowRemoval(this.props.repeaterRef.current, rowFocus);
  }

  public render() {
    return null;
  }
}

export function Repeater(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<Record<string, unknown>[]>;
  const {
    uid,
    formName,
    domId,
    value,
    onValueChanged,
    onRowRemoved,
    templateData,
    errors,
    isTouched,
    onBlur,
  } = useInputWidget<Record<string, unknown>[], RepeaterProps<FormWidget<string>>>(widget);

  const repeaterRef = useRef<HTMLDivElement>(null);

  const readonly = !!templateData.readonly;
  const disabled = !!templateData.disabled;
  // Read only and disabled freeze the number of rows: adding and removing do nothing, whoever calls them.
  const locked = readonly || disabled;

  const addItem = useCallback(
    (value: Record<string, unknown>[]) => {
      if (locked) return;
      const newValue = [...(value ?? []), {}];
      onValueChanged(newValue);
    },
    [onValueChanged, locked],
  );

  const removeItem = useCallback(
    (value: Record<string, unknown>[] | undefined, index: number) => {
      if (locked) return;
      const items = (value ?? []).filter((_, i) => index !== i);
      // Make sure we don't keep object references
      if ('structuredClone' in window) {
        onRowRemoved(structuredClone(items), index);
      } else {
        onRowRemoved(JSON.parse(JSON.stringify(items)), index);
      }
    },
    [onRowRemoved, locked],
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

  const renderWidgets = useCallback(() => {
    return (templateData.rows ?? []).map((row, index) => (
      <div key={row.uid} className="gui-repeater__card">
        <div className="gui-repeater__card-header">
          {templateData.title && (
            <span className="gui-repeater__card-title">{`${templateData.title} ${index + 1}`}</span>
          )}
          {!readonly && (
            <button
              type="button"
              tabIndex={0}
              className="gui-button gui-button--sm gui-repeater__remove-btn"
              onClick={() => removeItem(value, index)}
              disabled={disabled}
            >
              {templateData.removeButtonIcon && (
                <span
                  className={`gui-widget-icon gui-button-icon ${templateData.removeButtonIcon}`}
                  data-icon={templateData.removeButtonIcon}
                ></span>
              )}
              {templateData.removeLabel ?? 'Remove'}
            </button>
          )}
        </div>
        <WidgetRenderer widget={row} />
      </div>
    ));
  }, [templateData, value, removeItem, readonly, disabled]);

  const isRequired = (templateData.validator as Validator)?.required;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div
      className={`gui-repeater gui-field${readonly ? ' gui-repeater--readonly' : ''}${disabled ? ' gui-repeater--disabled' : ''}`}
    >
      <div
        ref={repeaterRef}
        id={domId}
        className={`gui-repeater__main-card gui-repeater__card${isFocused ? ' gui-repeater__card--focused' : ''}`}
        onFocus={onFocusIn}
        onBlur={onFocusOut}
      >
        <GuiLabelReact
          targetElement={repeaterRef.current || undefined}
          uid={uid}
          idPrefix={formName}
          label={templateData.label as string}
          errors={errors}
          touched={isTouched}
          required={isRequired}
          native={false}
        ></GuiLabelReact>

        {renderWidgets()}
        {!readonly && (
          <button
            type="button"
            tabIndex={0}
            className="gui-button gui-repeater__add-btn"
            onClick={() => addItem(value || [])}
            disabled={disabled}
          >
            {templateData.addButtonIcon && (
              <span
                className={`gui-widget-icon gui-button-icon ${templateData.addButtonIcon}`}
                data-icon={templateData.addButtonIcon}
              ></span>
            )}
            {templateData.addLabel ?? 'Add'}
          </button>
        )}
        <FocusAfterRowRemoval repeaterRef={repeaterRef} rowCount={templateData.rows?.length ?? 0} />
      </div>

      {showErrors && (
        <GuiErrorsReact
          uid={uid}
          idPrefix={formName}
          errors={errors}
          touched={isTouched}
        ></GuiErrorsReact>
      )}
    </div>
  );
}
