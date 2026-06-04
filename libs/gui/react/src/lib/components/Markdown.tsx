import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { type MarkdownProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import { GuiMarkdownReact } from '../web-components';
import '../styles.scss';

export function Markdown(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    MarkdownProps
  >(widget);

  const handleChange = useCallback(
    (e: Event) => onValueChanged((e as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const autocomplete = templateData.autocomplete;
  const maxLength = (templateData.validator as Validator)?.maxLength;
  const counterMode = templateData.counterMode;
  const autoGrow = templateData.autoGrow;
  const minimumHeight = templateData.minimumHeight;
  const tools = templateData.tools;
  const defaultOpenPreview = templateData.defaultOpenPreview;
  const headingTitle = templateData.headingTitle;
  const boldTitle = templateData.boldTitle;
  const italicTitle = templateData.italicTitle;
  const strikethroughTitle = templateData.strikethroughTitle;
  const quoteTitle = templateData.quoteTitle;
  const linkTitle = templateData.linkTitle;
  const orderedListTitle = templateData.orderedListTitle;
  const unorderedListTitle = templateData.unorderedListTitle;
  const splitViewTitle = templateData.splitViewTitle;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-markdown gui-field" style={{ flex: templateData.size }}>
      <GuiMarkdownReact
        uid={uid}
        label={label}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        hint={hint}
        placeholder={placeholder}
        autocomplete={autocomplete ?? undefined}
        counterMode={counterMode}
        minimumHeight={minimumHeight}
        autoGrow={autoGrow}
        maxLength={maxLength}
        tools={tools}
        defaultOpenPreview={defaultOpenPreview}
        headingTitle={headingTitle}
        boldTitle={boldTitle}
        italicTitle={italicTitle}
        strikethroughTitle={strikethroughTitle}
        quoteTitle={quoteTitle}
        linkTitle={linkTitle}
        orderedListTitle={orderedListTitle}
        unorderedListTitle={unorderedListTitle}
        splitViewTitle={splitViewTitle}
        dependencies={templateData.deps}
        onInput={handleChange}
        onBlur={onBlur}
      ></GuiMarkdownReact>
    </div>
  );
}
