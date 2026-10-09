import { GuiErrorsReact, GuiLabelReact, GuiListReact } from '../web-components';
import React, { useCallback, useRef, useState } from 'react';
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget, useItemRenderer } from '@golemui/react';
import type { ListProps, OptionValue } from '@golemui/gui-shared/internals';
import { DefaultListItemRenderer } from './item-renderers/DefaultListItemRenderer';
import { type ListItemRendererProps } from './item-renderers/props';
import { useBrowserLayoutEffect } from './shared/use-browser-layout-effect';
import type { GuiList } from '@golemui/gui-components/list';
import type { GuiVisibleItem } from '@golemui/gui-components';

export function List(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<OptionValue>;

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

  // The options to render, as the list reports them.
  const [visibleItems, setVisibleItems] = useState<GuiVisibleItem<any>[]>([]);

  const listRef = useRef<GuiList>(null);

  // A layout effect so these listeners exist before first paint. A passive effect
  // attaches them after paint, and an early click then fires 'change' with no listener.
  useBrowserLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const handleVisibleItemsChange = (e: Event) => {
      setVisibleItems((e as CustomEvent<GuiVisibleItem<any>[]>).detail);
    };

    const handleChange = (e: Event) => {
      const val = (e as CustomEvent).detail.value;
      onValueChanged(val);
    };

    // Binding
    element.addEventListener('gui-input', handleChange);
    element.addEventListener('gui-visible-items-change', handleVisibleItemsChange);
    // The list may have reported its items before these listeners existed.
    setVisibleItems(element.visibleItems ?? []);

    return () => {
      // Cleanup
      element.removeEventListener('gui-input', handleChange);
      element.removeEventListener('gui-visible-items-change', handleVisibleItemsChange);
    };
  }, [onValueChanged]);

  const ItemRenderer = (useItemRenderer(templateData.itemRenderer as string) ||
    DefaultListItemRenderer) as React.ComponentType<ListItemRendererProps<any>>;
  const label = templateData.label as string;
  const isRequired = (templateData.validator as Validator)?.required;
  const isDisabled = templateData.disabled as boolean;
  const isReadOnly = templateData.readonly as boolean;
  const showErrors = isTouched && errors && errors.length > 0;

  return (
    <div className="gui-list gui-field">
      <GuiLabelReact
        targetElement={listRef.current || undefined}
        uid={uid}
        label={label}
        hint={templateData.hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadOnly}
        native={false}
      ></GuiLabelReact>

      <div className="gui-widget">
        <GuiListReact
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
                id={item.id}
                className="gui-list__item-wrapper"
                style={{ height: `${templateData.itemHeight || 40}px` }}
                aria-selected={item.selected}
                aria-disabled={item.disabled ? 'true' : 'false'}
              >
                <ItemRenderer
                  template={template}
                  value={item.value}
                  index={item.index}
                  selected={item.selected}
                  disabled={item.disabled}
                  focused={item.focused}
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
