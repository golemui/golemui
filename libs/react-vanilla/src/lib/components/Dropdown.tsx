import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Core from '@golemui/core';
import { useControlField, useItemRenderer } from '@golemui/react'; // Asumiendo que exportaste el hook que creamos
import { DropdownProps, ListItem, OptionValue } from '@golemui/shared-vanilla';
import { DefaultListItemRenderer } from './item-renderers/DefaultListItemRenderer';
import { ListItemRendererProps } from './item-renderers/props';

interface GuiListElement extends HTMLElement {
  focusItemAtIndex(index: number): void;
  scrollToSelectedIndex(): void;
}

interface GuiLabelElement extends HTMLElement {
  targetElement?: HTMLElement | HTMLElement[];
}

export function Dropdown(fieldInstance: Core.WithField) {
  const field = fieldInstance.field as Core.ControlField<string | null>;

  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useControlField<
    string | number | null,
    DropdownProps<unknown>
  >(field);

  const [range, setRange] = useState({ start: 0, end: 10 });
  const [listItems, setListItems] = useState<ListItem<any>[]>([]);
  const [filteredItems, setFilteredItems] = useState<ListItem<any>[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);

  const listRef = useRef<GuiListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<GuiLabelElement>(null);

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
    (item: ListItem<any>, index: number) => {
      handleValueChange(item.value);
      setFocusedIndex(index);

      if (listRef.current) {
        listRef.current.focusItemAtIndex(index);
      }
    },
    [handleValueChange],
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
      handleValueChange(val);
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
  }, [handleValueChange, onValueChanged]);

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

  const handleInputFilter = (event: React.FormEvent<HTMLInputElement>) => {
    const filterValue = (event.target as HTMLInputElement).value;

    if (filterValue) {
      const items = templateData.items || [];
      const filtered = items.filter((item: any) =>
        templateData.valueField
          ? item[templateData.valueField]
              .toString()
              .toLowerCase()
              .includes(filterValue.toLowerCase())
          : item.toString().toLowerCase().includes(filterValue.toLowerCase()),
      );

      setFilteredItems(filtered);
      setIsFiltering(true);
      setIsListVisible(true);
    } else {
      setIsFiltering(false);
      setFilteredItems([...(templateData.items || [])]);
    }
  };

  const handleInputFocus = () => {
    setIsListVisible(true);

    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToSelectedIndex();
      }
    }, 0);
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
  const isRequired = (templateData.validator as Core.Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadOnly = templateData.readonly as boolean;

  return (
    <div className="gui-dropdown">
      <gui-label
        ref={labelRef}
        uid={uid}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
      ></gui-label>

      <div className="gui-field">
        <input
          ref={inputRef}
          type="text"
          id={uid}
          data-cy={`${uid}_textinput`}
          defaultValue={value ?? ''}
          required={isRequired}
          disabled={isDisabled}
          readOnly={isReadOnly}
          placeholder={templateData.placeholder ?? ''}
          onKeyDown={handleInputKeyDown}
          onInput={handleInputFilter}
          onFocus={handleInputFocus}
          onBlur={handleFocusOut}
        />

        <gui-list
          ref={listRef}
          id={`${uid}-list`}
          uid={uid}
          value={value ?? ''}
          valueField={templateData.valueField}
          items={isFiltering ? filteredItems : templateData.items}
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

            return (
              <div
                key={absoluteIndex}
                role="option"
                tabIndex={-1}
                className="gui-list__item-wrapper"
                id={`${uid}-item-${absoluteIndex}`}
                style={{ height: `${templateData.itemHeight || 40}px` }}
                aria-selected={isSelected}
                onClick={() => handleClickItem(item, absoluteIndex)}
              >
                <ItemRenderer
                  template={item.template}
                  value={item.value}
                  index={absoluteIndex}
                  selected={isSelected}
                  disabled={isDisabled || isReadOnly}
                  focused={isFocused}
                />
              </div>
            );
          })}
        </gui-list>
      </div>

      <gui-errors errors={errors} touched={isTouched}></gui-errors>
    </div>
  );
}
