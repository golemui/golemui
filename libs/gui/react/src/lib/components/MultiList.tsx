import { GuiErrorsReact, GuiLabelReact, GuiMultiListReact } from '../web-components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget, useItemRenderer } from '@golemui/react';
import type { ListItem, MultiListProps, OptionValue } from '@golemui/gui-shared/internals';
import { DefaultMultiListItemRenderer } from './item-renderers/DefaultMultiListItemRenderer';
import { type ListItemRendererProps } from './item-renderers/props';
import type { GuiMultiList } from '@golemui/gui-components/multi-list';

export function MultiList(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<OptionValue[]>;

  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    OptionValue[],
    MultiListProps<unknown>
  >(widget);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (listRef.current && e.relatedTarget && listRef.current.contains(e.relatedTarget as Node)) {
        return;
      }

      onBlur();
    },
    [onBlur],
  );

  const [range, setRange] = useState({ start: 0, end: 10 });
  const [listItems, setListItems] = useState<ListItem<any>[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const listRef = useRef<GuiMultiList>(null);

  const currentValues = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const visibleItems = useMemo(() => {
    const items = listItems.length > 0 ? listItems : templateData.items || [];
    return items.slice(range.start, range.end);
  }, [listItems, templateData.items, range]);

  const toggleValue = useCallback(
    (val: OptionValue) => {
      if (templateData.disabled || templateData.readonly) return;

      if (currentValues.includes(val)) {
        onValueChanged(currentValues.filter((v) => v !== val));
        return;
      }
      onValueChanged([...currentValues, val]);
    },
    [currentValues, onValueChanged, templateData.disabled, templateData.readonly],
  );

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const handleRangeChange = (e: Event) => {
      const { startIndex, endIndex } = (e as CustomEvent).detail;
      setRange({ start: startIndex, end: endIndex });
    };

    const handleUpdateItems = (e: Event) => {
      const items = (e as CustomEvent).detail;
      setListItems(items ? [...items] : []);
    };

    const handleFocusChange = (e: Event) => {
      const index = (e as CustomEvent).detail.index;
      setFocusedIndex(index);
    };

    const handleChange = (e: Event) => {
      const val = (e as CustomEvent).detail.value;
      toggleValue(val);
    };

    // Binding
    element.addEventListener('change', handleChange);
    element.addEventListener('gui-update-items', handleUpdateItems);
    element.addEventListener('gui-range-change', handleRangeChange);
    element.addEventListener('gui-focus-change', handleFocusChange);

    return () => {
      // Cleanup
      element.removeEventListener('change', handleChange);
      element.removeEventListener('gui-update-items', handleUpdateItems);
      element.removeEventListener('gui-range-change', handleRangeChange);
      element.removeEventListener('gui-focus-change', handleFocusChange);
    };
  }, [toggleValue]);

  const handleClickItem = useCallback(
    (item: ListItem<any>, index: number) => {
      if (templateData.disabled || item.disabled) return;

      toggleValue(item.value);
      setFocusedIndex(index);

      if (listRef.current) {
        listRef.current.focusItemAtIndex(index);
      }
    },
    [templateData.disabled, toggleValue],
  );

  const ItemRenderer = (useItemRenderer(templateData.itemRenderer as string) ||
    DefaultMultiListItemRenderer) as React.ComponentType<ListItemRendererProps<any>>;
  const label = templateData.label as string;
  const isRequired = (templateData.validator as Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadOnly = templateData.readonly as boolean;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-multi-list-widget gui-field" style={{ flex: templateData.size }}>
      <GuiLabelReact
        targetElement={listRef.current || undefined}
        uid={uid}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        native={false}
      ></GuiLabelReact>

      <div className="gui-widget">
        <GuiMultiListReact
          ref={listRef}
          id={uid}
          uid={uid}
          values={currentValues}
          valueField={templateData.valueField}
          items={templateData.items}
          itemHeight={templateData.itemHeight}
          height={templateData.height}
          required={isRequired}
          touched={isTouched}
          disabled={isDisabled}
          readOnly={isReadOnly}
          onBlur={handleBlur}
        >
          {visibleItems.map((item, index) => {
            const absoluteIndex = range.start + index;
            const isSelected = currentValues.includes(item.value);
            const isFocused = focusedIndex === absoluteIndex;
            const isItemDisabled = isDisabled || !!item.disabled;

            const labelField = templateData.labelField ?? 'label';
            const isObject = item.template !== null && typeof item.template === 'object';
            const template =
              isObject && labelField && !templateData.itemRenderer
                ? item.template[labelField]
                : item.template;

            return (
              <div
                key={absoluteIndex}
                role="option"
                tabIndex={-1}
                id={`${uid}-item-${absoluteIndex}`}
                className="gui-list__item-wrapper"
                style={{ height: `${templateData.itemHeight || 40}px` }}
                aria-selected={isSelected}
                aria-disabled={isItemDisabled ? 'true' : 'false'}
                onClick={() => handleClickItem(item, absoluteIndex)}
              >
                <ItemRenderer
                  template={template}
                  value={item.value}
                  index={index}
                  selected={isSelected}
                  disabled={isItemDisabled}
                  focused={isFocused}
                />
              </div>
            );
          })}
        </GuiMultiListReact>
      </div>

      {showErrors && (
        <GuiErrorsReact uid={uid} errors={errors} touched={isTouched}></GuiErrorsReact>
      )}
    </div>
  );
}
