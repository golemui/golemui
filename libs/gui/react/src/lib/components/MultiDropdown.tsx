import {
  GuiErrorsReact,
  GuiLabelReact,
  GuiMultiListReact,
  GuiMultiSelectTriggerReact,
} from '../web-components';
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useDebounceCallback, useInputWidget, useItemRenderer } from '@golemui/react';
import type {
  ListItem,
  ListProps,
  MultiDropdownProps,
  OptionValue,
} from '@golemui/gui-shared/internals';
import { updateListItems } from '@golemui/gui-components/internals';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DefaultMultiListItemRenderer } from './item-renderers/DefaultMultiListItemRenderer';
import { type ListItemRendererProps } from './item-renderers/props';
import { useBrowserLayoutEffect } from './shared/use-browser-layout-effect';
import type { GuiMultiList } from '@golemui/gui-components/multi-list';
import type { GuiMultiSelectTrigger } from '@golemui/gui-components/multi-select-trigger';
import type { GuiPillItem } from '@golemui/gui-components/pills';
import type { GuiLabel } from '@golemui/gui-components/label';

export function MultiDropdown(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<OptionValue[]>;

  const { uid, errors, value, isTouched, templateData, onFilter, onValueChanged, onBlur } =
    useInputWidget<OptionValue[], MultiDropdownProps<any>>(widget);

  const [range, setRange] = useState({ start: 0, end: 10 });
  const [listItems, setListItems] = useState<ListItem<any>[]>([]);
  const [filteredItems, setFilteredItems] = useState<ListItem<any>[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);

  const listRef = useRef<GuiMultiList>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<GuiMultiSelectTrigger>(null);
  const labelRef = useRef<GuiLabel>(null);
  const ignoreNextFocusRef = useRef(false);

  const currentValues = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const visibleItems = useMemo(() => listItems.slice(range.start, range.end), [listItems, range]);

  const pillItems = useMemo<GuiPillItem[]>(() => {
    const labelField = (templateData.labelField as string) ?? 'label';
    const source = updateListItems(
      (templateData.items ?? []) as ListItem<any>[],
      templateData as unknown as ListProps<any>,
    );
    return currentValues.map((val) => {
      const item = source.find((i) => i.value === val) ?? listItems.find((i) => i.value === val);
      const isObject = item != null && item.template !== null && typeof item.template === 'object';
      const label =
        item == null
          ? String(val)
          : isObject
            ? String((item.template as any)[labelField])
            : String(item.template);
      return { key: String(val), label };
    });
  }, [currentValues, listItems, templateData]);

  const closeList = useCallback(() => {
    onBlur();
    setIsListVisible(false);
    setIsFiltering(false);
  }, [onBlur]);

  const openPanel = useCallback(() => {
    triggerRef.current?.closePillsDropdown();
    setIsListVisible(true);

    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToSelectedIndex();
      }
    }, 0);
  }, []);

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

  const handleClickItem = useCallback(
    (item: ListItem<any>, index: number) => {
      if (templateData.readonly || item.disabled) return;

      toggleValue(item.value);
      setFocusedIndex(index);

      if (listRef.current) {
        listRef.current.focusItemAtIndex(index);
      }
    },
    [templateData.readonly, toggleValue],
  );

  // A layout effect so these listeners exist before first paint. A passive effect
  // attaches them after paint, and an early click then fires 'change' with no listener.
  useBrowserLayoutEffect(() => {
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
  }, [toggleValue]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isListVisible) return;

      const target = event.target as Node;
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(target);
      const clickedPanel = panelRef.current && panelRef.current.contains(target);

      if (!clickedTrigger && !clickedPanel) {
        closeList();
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [closeList, isListVisible]);

  useEffect(() => {
    if (!labelRef.current) return;
    const targets = [triggerRef.current?.input, listRef.current].filter(Boolean) as HTMLElement[];
    if (targets.length) {
      labelRef.current.targetElement = targets;
    }
  });

  const handleTriggerKeyDown = async (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openPanel();

      setTimeout(() => {
        if (listRef.current) {
          listRef.current.focus();
        }
      }, 0);
    }
  };

  const filterItems = useCallback(
    (filterValue: string) => {
      const asyncFiltering = !!widget.on?.filter;

      onFilter(filterValue as unknown as OptionValue[]);

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

  const handleInputFilter = (event: React.FormEvent) => {
    const filterValue = (event.target as HTMLInputElement).value;

    if (!isListVisible) {
      setIsListVisible(true);
    }

    debouncedFilter(filterValue);
  };

  const handleFocusIn = useCallback(
    (e: React.FocusEvent) => {
      if (ignoreNextFocusRef.current) return;
      if (isListVisible) return;

      if (e.target !== triggerRef.current?.input) return;

      openPanel();
    },
    [isListVisible, openPanel],
  );

  const handleWidgetKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Escape' || !isListVisible) return;
    event.preventDefault();
    event.stopPropagation();
    setIsListVisible(false);
    setIsFiltering(false);
    ignoreNextFocusRef.current = true;
    triggerRef.current?.focusInput();
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
      triggerRef.current?.focusInput();
      setTimeout(() => {
        ignoreNextFocusRef.current = false;
      });
    } else {
      triggerRef.current?.focusInput();
      openPanel();
    }
  };

  const handleFocusOut = (e: React.FocusEvent) => {
    const newFocusTarget = e.relatedTarget as Node;

    if (newFocusTarget && widgetRef.current?.contains(newFocusTarget)) {
      return;
    }

    closeList();
  };

  const handlePillRemove = useCallback(
    (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      const val = currentValues.find((v) => String(v) === key);
      if (val === undefined) return;
      toggleValue(val);
    },
    [currentValues, toggleValue],
  );

  const handlePillsDropdownToggle = useCallback(
    (e: Event) => {
      if ((e as CustomEvent).detail?.open && isListVisible) {
        setIsListVisible(false);
      }
    },
    [isListVisible],
  );

  const ItemRenderer = (useItemRenderer(templateData.itemRenderer as string) ||
    DefaultMultiListItemRenderer) as React.ComponentType<ListItemRendererProps<any>>;
  const label = templateData.label as string;
  const isRequired = (templateData.validator as Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadOnly = templateData.readonly as boolean;
  const asyncFiltering = !!widget.on?.filter;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-multi-dropdown gui-field" style={{ flex: templateData.size }}>
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
        <GuiMultiSelectTriggerReact
          ref={triggerRef}
          uid={uid}
          pills={pillItems}
          errors={errors}
          touched={isTouched}
          required={isRequired}
          disabled={isDisabled}
          readOnly={isReadOnly}
          placeholder={templateData.placeholder ?? ''}
          icon={templateData.icon}
          autocomplete={templateData.autocomplete}
          hasLabel={!!templateData.label}
          hasHint={!!templateData.hint}
          panelOpen={isListVisible}
          panelId={`${uid}-list`}
          removeAriaLabel={templateData.removeAriaLabel}
          removeIcon={templateData.removeIcon}
          compactAriaLabel={`${pillItems.length} selected`}
          onKeyDown={handleTriggerKeyDown}
          onInput={handleInputFilter}
          onFocus={handleFocusIn}
          onPillremove={handlePillRemove}
          onDropdowntoggle={handlePillsDropdownToggle}
        ></GuiMultiSelectTriggerReact>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
          </svg>
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
          <GuiMultiListReact
            ref={listRef}
            id={`${uid}-list`}
            uid={uid}
            values={currentValues}
            valueField={templateData.valueField! as string}
            items={isFiltering && !asyncFiltering ? filteredItems : templateData.items}
            itemHeight={templateData.itemHeight}
            height={templateData.height}
            required={isRequired}
            touched={isTouched}
            disabled={isDisabled || isReadOnly}
            readOnly={isReadOnly}
            hidden={!isListVisible}
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
          </GuiMultiListReact>
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
