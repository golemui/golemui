import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget, useItemRenderer } from '@golemui/react';
import {
  buildTimeOptions,
  formatISOTimeForLocale,
  resolveHourFormat,
} from '@golemui/gui-components/internals';
import type { ListItem, TimePickerProps } from '@golemui/gui-shared/internals';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles.scss';
import { Errors } from './shared/Errors';
import { GuiListReact, GuiTimeReact } from '../web-components';
import { DefaultListItemRenderer } from './item-renderers/DefaultListItemRenderer';
import { type ListItemRendererProps } from './item-renderers/props';
import type { GuiList } from '@golemui/gui-components/list';

export function TimePicker(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const {
    uid,
    errors,
    value,
    isTouched,
    templateData,
    onValueChanged,
    onBlur,
    injectValidationIssues,
  } = useInputWidget<string, TimePickerProps>(widget);

  const [isListVisible, setIsListVisible] = useState(false);
  const [range, setRange] = useState({ start: 0, end: 10 });
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeControlRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<GuiList>(null);

  const lang = templateData.lang;
  const hourFormat = resolveHourFormat(lang, templateData.hourFormat);

  /** Selectable slots with locale display labels, disabled inside disabledRanges. */
  const timeItems = useMemo<ListItem<string>[]>(
    () =>
      buildTimeOptions(templateData).map((slot) => ({
        template: formatISOTimeForLocale(slot.value, lang, hourFormat),
        value: slot.value,
        disabled: slot.disabled,
      })),
    [
      lang,
      hourFormat,
      templateData.minTime,
      templateData.maxTime,
      templateData.minuteStep,
      templateData.disabledRanges,
    ],
  );

  const visibleItems = useMemo(() => timeItems.slice(range.start, range.end), [timeItems, range]);

  const openList = useCallback(() => {
    setIsListVisible(true);
    requestAnimationFrame(() => listRef.current?.scrollToSelectedIndex());
  }, []);

  const selectValue = useCallback(
    (newValue: string) => {
      injectValidationIssues(null);
      onValueChanged(newValue);
      setIsListVisible(false);
    },
    [injectValidationIssues, onValueChanged],
  );

  const handleClickItem = useCallback(
    (item: ListItem<string>, index: number) => {
      if (templateData.readonly || item.disabled) return;

      selectValue(item.value as string);
      setFocusedIndex(index);
    },
    [selectValue, templateData.readonly],
  );

  const handleTimeRef = useCallback(
    (node: HTMLElement | null) => {
      const target = node as any;
      const changeHandler = (e: CustomEvent) => {
        injectValidationIssues(null);
        onValueChanged(e.detail.value);
      };
      const errorHandler = (e: CustomEvent) => {
        injectValidationIssues([e.detail.message]);
      };
      const focusHandler = () => {
        openList();
      };

      timeControlRef.current = node;

      if (node) {
        target.addEventListener('change', changeHandler);
        target.addEventListener('focus', focusHandler);
        target.addEventListener('blur', onBlur);
        target.addEventListener('inputError', errorHandler);
      }

      return () => {
        target.removeEventListener('change', changeHandler);
        target.removeEventListener('focus', focusHandler);
        target.removeEventListener('blur', onBlur);
        target.removeEventListener('inputError', errorHandler);
      };
    },
    [onValueChanged, onBlur, injectValidationIssues, openList],
  );

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const handleRangeChange = (e: Event) => {
      const { startIndex, endIndex } = (e as CustomEvent).detail;
      setRange({ start: startIndex, end: endIndex });
    };

    const handleFocusChange = (e: Event) => {
      setFocusedIndex((e as CustomEvent).detail.index);
    };

    // Enter/Space selection inside the list commits a single time, so close
    const handleChange = (e: Event) => {
      selectValue((e as CustomEvent).detail.value);
    };

    element.addEventListener('gui-range-change', handleRangeChange);
    element.addEventListener('gui-focus-change', handleFocusChange);
    element.addEventListener('change', handleChange);

    return () => {
      element.removeEventListener('gui-range-change', handleRangeChange);
      element.removeEventListener('gui-focus-change', handleFocusChange);
      element.removeEventListener('change', handleChange);
    };
  }, [selectValue]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!isListVisible) return;
      const path = event.composedPath();
      const clickedInsideTime = timeControlRef.current && path.includes(timeControlRef.current);
      const clickedInsideList = listRef.current && path.includes(listRef.current);

      if (!clickedInsideTime && !clickedInsideList) {
        setIsListVisible(false);
      }
    };

    document.addEventListener('click', onDocumentClick);

    return () => {
      document.removeEventListener('click', onDocumentClick);
    };
  }, [isListVisible]);

  const onFocusOut = (event: React.FocusEvent) => {
    if (!isListVisible) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && containerRef.current?.contains(newFocusTarget)) {
      return;
    }

    setIsListVisible(false);
  };

  const toggleList = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;

    if (target.closest('.gui-list__item-wrapper')) return;

    const isInputClick = target.closest('.gui-time-input__part');
    const isListClick = target.closest('gui-list');
    if (isInputClick || isListClick) {
      if (!isListVisible) openList();
    } else {
      setIsListVisible((prev) => !prev);
    }
  };

  /**
   * Select-like keyboard behavior when custom time entry is off: ArrowDown/
   * ArrowUp move the value to the next/previous enabled option (the first or
   * last one when nothing is selected yet).
   */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (templateData.allowCustomTime || templateData.readonly || templateData.disabled) return;
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    const target = event.target as HTMLElement;
    if (!target.closest('gui-time')) return;

    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const currentIndex = timeItems.findIndex((item) => item.value === value);
    let index =
      currentIndex === -1 ? (direction === 1 ? 0 : timeItems.length - 1) : currentIndex + direction;
    while (index >= 0 && index < timeItems.length && timeItems[index].disabled) {
      index += direction;
    }
    if (index < 0 || index >= timeItems.length) return;

    injectValidationIssues(null);
    onValueChanged(timeItems[index].value as string);
    setFocusedIndex(index);
    openList();
  };

  const ItemRenderer = (useItemRenderer(templateData.itemRenderer as string) ||
    DefaultListItemRenderer) as React.ComponentType<ListItemRendererProps<any>>;

  const hint = templateData.hint;
  const showErrors = isTouched && errors && errors.length > 0;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div
      ref={containerRef}
      className="gui-time-picker gui-field"
      style={{ flex: templateData.size }}
      onBlur={onFocusOut}
    >
      {templateData.label && (
        <label className="gui-label" htmlFor={uid} data-cy={`${uid}_label`}>
          {templateData.label + (isRequired ? ' *' : '')}
          {hint && (
            <div className="gui-widget-hint" id={`${uid}_hint`}>
              {hint}
            </div>
          )}
        </label>
      )}
      <div
        role="button"
        tabIndex={-1}
        className="gui-widget"
        onClick={toggleList}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            setIsListVisible((prev) => !prev);
          }
        }}
        aria-expanded={isListVisible}
      >
        <GuiTimeReact
          ref={handleTimeRef}
          uid={uid}
          hint={hint}
          showErrors={false}
          errors={errors}
          touched={isTouched}
          required={isRequired}
          disabled={isDisabled}
          readOnly={isReadonly || !templateData.allowCustomTime}
          value={value}
          icon={templateData.icon}
          localeId={lang}
          hourFormat={templateData.hourFormat}
          minuteStep={templateData.minuteStep}
          minTime={templateData.minTime}
          maxTime={templateData.maxTime}
          disabledRanges={templateData.disabledRanges}
          minTimeMessage={templateData.minTimeMessage as string}
          maxTimeMessage={templateData.maxTimeMessage as string}
          disabledRangeMessage={templateData.disabledRangeMessage as string}
        />
        <span className="gui-time-picker__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
        </span>

        <GuiListReact
          ref={listRef}
          id={uid}
          uid={uid}
          value={value ?? ''}
          items={timeItems}
          itemHeight={templateData.itemHeight}
          height={templateData.height}
          required={isRequired}
          touched={isTouched}
          disabled={isDisabled}
          readOnly={isReadonly}
          hidden={!isListVisible}
        >
          {visibleItems.map((item, index) => {
            const absoluteIndex = range.start + index;
            const isSelected = value === item.value;
            const isFocused = focusedIndex === absoluteIndex;
            const isItemDisabled = isDisabled || !!item.disabled;

            return (
              <div
                key={absoluteIndex}
                role="option"
                tabIndex={-1}
                className="gui-list__item-wrapper"
                id={`${uid}-item-${absoluteIndex}`}
                style={{ height: `${templateData.itemHeight || 40}px` }}
                aria-selected={isSelected}
                aria-disabled={isItemDisabled ? 'true' : 'false'}
                onClick={() => handleClickItem(item, absoluteIndex)}
              >
                <ItemRenderer
                  template={item.template}
                  value={item.value}
                  index={absoluteIndex}
                  selected={isSelected}
                  disabled={isItemDisabled}
                  focused={isFocused}
                />
              </div>
            );
          })}
        </GuiListReact>
      </div>
      {showErrors && <Errors errors={errors} uid={uid} />}
    </div>
  );
}
