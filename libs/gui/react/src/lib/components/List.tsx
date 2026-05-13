import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Core from '@golemui/core';
import { useInputWidget, useItemRenderer } from '@golemui/react';
import { ListItem, ListProps, OptionValue } from '@golemui/gui-shared';
import { DefaultListItemRenderer } from './item-renderers/DefaultListItemRenderer';
import { ListItemRendererProps } from './item-renderers/props';

interface GuiListElement extends HTMLElement {
  focusItemAtIndex(index: number): void;
}

export function List(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<OptionValue>;

  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    OptionValue,
    ListProps<unknown>
  >(widget);

  // React catches bubbling blur events meanwhile Lit and Angular don't, we prevent double blur events here
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

  const listRef = useRef<GuiListElement>(null);

  const visibleItems = useMemo(() => {
    const items = listItems.length > 0 ? listItems : templateData.items || [];
    return items.slice(range.start, range.end);
  }, [listItems, templateData.items, range]);

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
      onValueChanged(val);
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
  }, [onValueChanged]);

  const handleClickItem = useCallback(
    (item: ListItem<any>, index: number) => {
      if (templateData.disabled) return;

      onValueChanged(item.value);
      setFocusedIndex(index);

      if (listRef.current) {
        listRef.current.focusItemAtIndex(index);
      }
    },
    [onValueChanged],
  );

  const ItemRenderer = (useItemRenderer(templateData.itemRenderer as string) ||
    DefaultListItemRenderer) as React.ComponentType<ListItemRendererProps<any>>;
  const label = templateData.label as string;
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadOnly = templateData.readonly as boolean;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-list gui-field" style={{ flex: templateData.size }}>
      <gui-label
        targetElement={listRef.current || undefined}
        uid={uid}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        native={false}
      ></gui-label>

      <div className="gui-widget">
        <gui-list
          ref={listRef}
          id={uid}
          uid={uid}
          value={value ?? ''}
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
            const isSelected = value === item.value;
            const isFocused = focusedIndex === absoluteIndex;

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
                aria-disabled={isDisabled ? 'true' : 'false'}
                onClick={() => handleClickItem(item, absoluteIndex)}
              >
                <ItemRenderer
                  template={template}
                  value={item.value}
                  index={index}
                  selected={isSelected}
                  disabled={isDisabled}
                  focused={isFocused}
                />
              </div>
            );
          })}
        </gui-list>
      </div>

      {showErrors && <gui-errors uid={uid} errors={errors} touched={isTouched}></gui-errors>}
    </div>
  );
}
