import { GuiErrorsReact, GuiLabelReact, GuiListReact } from '../web-components';
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useDebounceCallback, useInputWidget, useItemRenderer } from '@golemui/react';
import type { DropdownProps, ListItem, OptionValue } from '@golemui/gui-shared/internals';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DefaultListItemRenderer } from './item-renderers/DefaultListItemRenderer';
import { type ListItemRendererProps } from './item-renderers/props';
import type { GuiList } from '@golemui/gui-components/list';
import type { GuiLabel } from '@golemui/gui-components/label';

export function Dropdown(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string | null>;

  const { uid, errors, value, isTouched, templateData, onFilter, onValueChanged, onBlur } =
    useInputWidget<string | number | null, DropdownProps<never>>(widget);

  const [range, setRange] = useState({ start: 0, end: 10 });
  const [listItems, setListItems] = useState<ListItem<never>[]>([]);
  const [filteredItems, setFilteredItems] = useState<ListItem<never>[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem<never> | undefined>(undefined);

  const listRef = useRef<GuiList>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<GuiLabel>(null);
  const ignoreNextFocusRef = useRef(false);

  const visibleItems = useMemo(() => listItems.slice(range.start, range.end), [listItems, range]);

  const closeList = useCallback(() => {
    onBlur();
    setIsListVisible(false);
    setIsFiltering(false);
  }, [onBlur]);

  const handleValueChange = useCallback(
    (newValue: OptionValue | null) => {
      onValueChanged(newValue);

      if (inputRef.current) {
        const items = templateData.items || [];
        const selectedItem = items.find((item: any) =>
          templateData.valueField ? item[templateData.valueField] === newValue : item === newValue,
        );

        if (selectedItem) {
          const displayValue = templateData.valueField
            ? (selectedItem as any)[templateData.valueField]
            : selectedItem;

          inputRef.current.value = String(displayValue);
        } else if (!newValue) {
          inputRef.current.value = '';
        }
      }

      setIsListVisible(false);
      setIsFiltering(false);
    },
    [onValueChanged, templateData],
  );

  const handleClickItem = useCallback(
    (item: ListItem<never>, index: number) => {
      if (templateData.readonly || item.disabled) return;

      handleValueChange(item.value);
      onFilter('');
      setFocusedIndex(index);
      setSelectedItem(item);
      setIsFiltering(false);
      setIsListVisible(false);

      if (listRef.current) {
        listRef.current.focusItemAtIndex(index);
      }
    },
    [handleValueChange, onFilter, templateData.readonly],
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

      // Resolve selected item on initial load when a default value is set
      if (!selectedItem && value != null && items) {
        const match = items.find((item: ListItem<never>) => item.value === value);
        if (match) {
          setSelectedItem(match);
        }
      }
    };

    const handleFocusChange = (e: Event) => {
      const index = (e as CustomEvent).detail.index;
      setFocusedIndex(index);
    };

    const handleChange = (e: Event) => {
      const val = (e as CustomEvent).detail.value;
      handleValueChange(val);
      setSelectedItem(listItems.find((item) => item.value === val));
      setIsFiltering(false);
      setIsListVisible(false);
    };

    element.addEventListener('gui-range-change', handleRangeChange);
    element.addEventListener('gui-update-items', handleUpdateItems);
    element.addEventListener('gui-focus-change', handleFocusChange);
    element.addEventListener('change', handleChange);

    return () => {
      element.removeEventListener('gui-range-change', handleRangeChange);
      element.removeEventListener('gui-update-items', handleUpdateItems);
      element.removeEventListener('gui-focus-change', handleFocusChange);
      element.removeEventListener('change', handleChange);
    };
  }, [handleValueChange, listItems, onValueChanged]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isListVisible) return;

      const target = event.target as Node;
      const clickedInput = inputRef.current && inputRef.current.contains(target);
      const clickedList = listRef.current && listRef.current.contains(target);

      if (!clickedInput && !clickedList) {
        closeList();
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [closeList, isListVisible]);

  useEffect(() => {
    const isObject = selectedItem?.template !== null && typeof selectedItem?.template === 'object';
    const referenceField = isObject ? (templateData.labelField ?? 'label') : null;
    const val = referenceField ? selectedItem?.template[referenceField] : selectedItem?.template;
    inputRef.current!.value = val ?? '';
  }, [selectedItem, templateData.labelField]);

  useEffect(() => {
    if (labelRef.current && inputRef.current && listRef.current) {
      labelRef.current.targetElement = [inputRef.current, listRef.current];
    }
  }, []);

  const handleInputKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    const key = event.key;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();

        setIsListVisible(true);

        setTimeout(() => {
          if (listRef.current) {
            listRef.current.focus();
            listRef.current.scrollToSelectedIndex();
          }
        }, 0);
        break;
      case 'Enter':
        if (!inputRef.current?.value) {
          handleValueChange(null);
        }
        break;
    }
  };

  const filterItems = useCallback(
    (filterValue: string) => {
      const asyncFiltering = !!widget.on?.filter;

      onFilter(filterValue);

      if (filterValue && !asyncFiltering) {
        setIsFiltering(true);
        setIsListVisible(true);

        const searchFields =
          templateData.searchFields ??
          ([templateData.labelField!, templateData.valueField!].filter(
            (field) => !!field,
          ) as string[]);
        const hasSearchFields = searchFields.length > 0;
        const items = templateData.items || [];
        const filteredItems = items.filter((item: any) => {
          const isPrimitiveValue = item === null || typeof item !== 'object';

          if (isPrimitiveValue) {
            return (
              item != null && item.toString().toLowerCase().includes(filterValue.toLowerCase())
            );
          }

          const keys = Object.keys(item);
          const reduceFunc = (acc: boolean, prop: string) =>
            acc || item[prop].toString().toLowerCase().includes(filterValue.toLowerCase());

          return hasSearchFields
            ? keys.filter((prop: string) => searchFields.includes(prop)).reduce(reduceFunc, false)
            : keys.reduce(reduceFunc, false);
        });

        setFilteredItems(filteredItems);
      } else {
        setIsFiltering(false);
        setFilteredItems([...(templateData.items || [])]);
      }
    },
    [
      widget.on?.filter,
      onFilter,
      templateData.items,
      templateData.labelField,
      templateData.searchFields,
      templateData.valueField,
    ],
  );

  const debouncedFilter = useDebounceCallback(filterItems, templateData.inputDebounce ?? 500);

  const handleInputFilter = (event: React.FormEvent<HTMLInputElement>) => {
    const filterValue = (event.target as HTMLInputElement).value;

    if (!isListVisible) {
      setIsListVisible(true);
    }

    debouncedFilter(filterValue);
  };

  const handleInputFocus = useCallback(() => {
    if (ignoreNextFocusRef.current) return;
    if (isListVisible) return;

    setIsListVisible(true);

    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToSelectedIndex();
      }
    }, 0);
  }, [isListVisible]);

  const handleWidgetKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape' || !isListVisible) return;
    event.preventDefault();
    event.stopPropagation();
    setIsListVisible(false);
    setIsFiltering(false);
    ignoreNextFocusRef.current = true;
    inputRef.current?.focus();
    setTimeout(() => {
      ignoreNextFocusRef.current = false;
    });
  };

  const handleFocusOut = (e: React.FocusEvent) => {
    const newFocusTarget = e.relatedTarget as Node;
    const isGoingToInput = inputRef.current && inputRef.current.contains(newFocusTarget);
    const isGoingToList = listRef.current && listRef.current.contains(newFocusTarget);

    if (isGoingToInput || isGoingToList) {
      return;
    }

    closeList();
  };

  const ItemRenderer = (useItemRenderer(templateData.itemRenderer as string) ||
    DefaultListItemRenderer) as React.ComponentType<ListItemRendererProps<any>>;
  const label = templateData.label as string;
  const isRequired = (templateData.validator as Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadOnly = templateData.readonly as boolean;
  const asyncFiltering = !!widget.on?.filter;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-dropdown gui-field" style={{ flex: templateData.size }}>
      <GuiLabelReact
        ref={labelRef}
        uid={uid}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        native={false}
      ></GuiLabelReact>

      <div className="gui-widget" onKeyDown={handleWidgetKeyDown}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          id={uid}
          data-cy={`${uid}_textinput`}
          className="gui-widget-input"
          defaultValue={value ?? ''}
          required={isRequired}
          disabled={isDisabled}
          readOnly={isReadOnly}
          placeholder={templateData.placeholder ?? ''}
          autoComplete={templateData.autocomplete ?? undefined}
          onKeyDown={handleInputKeyDown}
          onInput={handleInputFilter}
          onFocus={handleInputFocus}
          onBlur={handleFocusOut}
          aria-expanded={isListVisible ? 'true' : 'false'}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-labelledby={templateData.label ? `${uid}_label` : undefined}
          aria-describedby={templateData.hint ? `${uid}_hint` : undefined}
        />
        <span className="gui-dropdown__arrow">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
        </span>

        <GuiListReact
          ref={listRef}
          id={`${uid}-list`}
          uid={uid}
          value={value ?? ''}
          valueField={templateData.valueField! as string}
          items={isFiltering && !asyncFiltering ? filteredItems : templateData.items}
          itemHeight={templateData.itemHeight}
          height={templateData.height}
          required={isRequired}
          touched={isTouched}
          disabled={isDisabled || isReadOnly}
          readOnly={isReadOnly}
          hidden={!isListVisible}
          onFocus={handleInputFocus}
          onBlur={handleFocusOut}
        >
          {visibleItems.map((item, index) => {
            const absoluteIndex = range.start + index;
            const isSelected = value === item.value;
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
                className="gui-list__item-wrapper"
                id={`${uid}-item-${absoluteIndex}`}
                style={{ height: `${templateData.itemHeight || 40}px` }}
                aria-selected={isSelected}
                aria-disabled={isItemDisabled ? 'true' : 'false'}
                onClick={() => handleClickItem(item, absoluteIndex)}
              >
                <ItemRenderer
                  template={template}
                  value={item.value}
                  index={absoluteIndex}
                  selected={isSelected}
                  disabled={isItemDisabled || isReadOnly}
                  focused={isFocused}
                />
              </div>
            );
          })}
        </GuiListReact>
      </div>

      {showErrors && (
        <GuiErrorsReact uid={uid} errors={errors} touched={isTouched}></GuiErrorsReact>
      )}
    </div>
  );
}
