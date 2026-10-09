import { GuiErrorsReact, GuiLabelReact, GuiListReact } from '../web-components';
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useDebounceCallback, useInputWidget, useItemRenderer } from '@golemui/react';
import type { DropdownProps, ListItem, OptionValue } from '@golemui/gui-shared/internals';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DefaultListItemRenderer } from './item-renderers/DefaultListItemRenderer';
import { type ListItemRendererProps } from './item-renderers/props';
import { useBrowserLayoutEffect } from './shared/use-browser-layout-effect';
import { searchItems } from '@golemui/gui-components/internals';
import type { GuiList } from '@golemui/gui-components/list';
import type { GuiVisibleItem } from '@golemui/gui-components';
import type { GuiLabel } from '@golemui/gui-components/label';

export function Dropdown(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string | null>;

  const { uid, errors, value, isTouched, templateData, onFilter, onValueChanged, onBlur } =
    useInputWidget<string | number | null, DropdownProps<never>>(widget);

  // The options to render, as the list reports them.
  const [visibleItems, setVisibleItems] = useState<GuiVisibleItem<any>[]>([]);
  const [listItems, setListItems] = useState<ListItem<never>[]>([]);
  const [filteredItems, setFilteredItems] = useState<ListItem<never>[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListItem<never> | undefined>(undefined);

  const listRef = useRef<GuiList>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<GuiLabel>(null);
  const ignoreNextFocusRef = useRef(false);

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

  // A layout effect so these listeners exist before first paint. A passive effect
  // attaches them after paint, and an early click then fires 'change' with no listener.
  useBrowserLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const handleVisibleItemsChange = (e: Event) => {
      setVisibleItems((e as CustomEvent<GuiVisibleItem<any>[]>).detail);
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

    const handleChange = (e: Event) => {
      const val = (e as CustomEvent).detail.value;
      handleValueChange(val);
      onFilter('');
      setSelectedItem(listItems.find((item) => item.value === val));
      setIsFiltering(false);
      setIsListVisible(false);
    };

    element.addEventListener('gui-visible-items-change', handleVisibleItemsChange);

    // The list may have reported its items before these listeners existed.

    setVisibleItems(element.visibleItems ?? []);
    element.addEventListener('gui-update-items', handleUpdateItems);
    element.addEventListener('gui-input', handleChange);

    return () => {
      element.removeEventListener('gui-visible-items-change', handleVisibleItemsChange);
      element.removeEventListener('gui-update-items', handleUpdateItems);
      element.removeEventListener('gui-input', handleChange);
    };
  }, [handleValueChange, listItems, onFilter, onValueChanged]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isListVisible) return;

      const target = event.target as Node;
      const clickedInput = inputRef.current && inputRef.current.contains(target);
      const clickedPanel = panelRef.current && panelRef.current.contains(target);

      if (!clickedInput && !clickedPanel) {
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

        const filteredItems = searchItems(templateData.items || [], filterValue, {
          labelField: templateData.labelField as string | undefined,
          valueField: templateData.valueField as string | undefined,
          searchFields: templateData.searchFields as string[] | undefined,
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

  const handleToggleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const handleToggleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isListVisible) {
      setIsListVisible(false);
      setIsFiltering(false);
      ignoreNextFocusRef.current = true;
      inputRef.current?.focus();
      setTimeout(() => {
        ignoreNextFocusRef.current = false;
      });
    } else {
      inputRef.current?.focus();
      handleInputFocus();
    }
  };

  const handleFocusOut = (e: React.FocusEvent) => {
    const newFocusTarget = e.relatedTarget as Node;

    if (newFocusTarget && widgetRef.current?.contains(newFocusTarget)) {
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
    <div className="gui-dropdown gui-field">
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

      <div
        ref={widgetRef}
        className="gui-widget"
        onKeyDown={handleWidgetKeyDown}
        onBlur={handleFocusOut}
      >
        {templateData.icon && (
          <span
            className={`gui-widget-icon ${templateData.icon}`}
            data-icon={templateData.icon}
            aria-hidden="true"
          ></span>
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          id={uid}
          data-cy={`${uid}_textinput`}
          className={`gui-widget-input${templateData.icon ? ' gui-dropdown--icon' : ''}`}
          defaultValue={value ?? ''}
          required={isRequired}
          disabled={isDisabled}
          readOnly={isReadOnly}
          placeholder={templateData.placeholder ?? ''}
          autoComplete={templateData.autocomplete ?? undefined}
          onKeyDown={handleInputKeyDown}
          onInput={handleInputFilter}
          onFocus={handleInputFocus}
          aria-expanded={isListVisible ? 'true' : 'false'}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-labelledby={templateData.label ? `${uid}_label` : undefined}
          aria-describedby={templateData.hint ? `${uid}_hint` : undefined}
        />
        <button
          type="button"
          className="gui-dropdown__arrow"
          aria-label={templateData.toggleAriaLabel ?? 'Show options'}
          aria-haspopup="listbox"
          aria-expanded={isListVisible ? 'true' : 'false'}
          aria-controls={`${uid}-list`}
          disabled={isDisabled}
          onMouseDown={handleToggleMouseDown}
          onClick={handleToggleClick}
        >
          <span className="gui-caret" aria-hidden="true"></span>
        </button>

        <div
          className="gui-picker__panel"
          hidden={!isListVisible}
          ref={panelRef}
          onMouseDown={(event) => {
            const target = event.target as Node;
            if (listRef.current && listRef.current.contains(target)) return;
            event.preventDefault();
          }}
        >
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
          >
            {visibleItems.map((item) => {
              const labelField = templateData.labelField ?? 'label';
              const isObject = item.template !== null && typeof item.template === 'object';
              const template =
                isObject && labelField && !templateData.itemRenderer
                  ? item.template[labelField]
                  : item.template;

              return (
                <div
                  key={item.index}
                  role="option"
                  tabIndex={-1}
                  className="gui-list__item-wrapper"
                  id={item.id}
                  style={{ height: `${templateData.itemHeight || 40}px` }}
                  aria-selected={item.selected}
                  aria-disabled={item.disabled ? 'true' : 'false'}
                >
                  <ItemRenderer
                    template={template}
                    value={item.value}
                    index={item.index}
                    selected={item.selected}
                    disabled={item.disabled || isReadOnly}
                    focused={item.focused}
                  />
                </div>
              );
            })}
          </GuiListReact>
          {showErrors && (
            <GuiErrorsReact panel uid={uid} errors={errors} touched={isTouched}></GuiErrorsReact>
          )}
        </div>
      </div>

      {showErrors && (
        <GuiErrorsReact uid={uid} errors={errors} touched={isTouched}></GuiErrorsReact>
      )}
    </div>
  );
}
