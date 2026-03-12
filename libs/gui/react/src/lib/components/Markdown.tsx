import * as Core from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { MarkdownProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '../styles.scss';

export function Markdown(widgetInstance: Core.WithWidget) {
  const widget = widgetInstance.widget as Core.InputWidget<string>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    MarkdownProps
  >(widget);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const maxLength = (templateData.validator as Core.Validator)?.maxLength;
  const counterMode = templateData.counterMode;
  const autoGrow = templateData.autoGrow;
  const minimumHeight = templateData.minimumHeight;
  const tools = templateData.tools;
  const defaultOpenPreview = templateData.defaultOpenPreview;
  const headingTitle = templateData.headingTitle;
  const boldTitle = templateData.boldTitle;
  const italicTitle = templateData.italicTitle;
  const quoteTitle = templateData.quoteTitle;
  const linkTitle = templateData.linkTitle;
  const orderedListTitle = templateData.orderedListTitle;
  const unorderedListTitle = templateData.unorderedListTitle;
  const splitViewTitle = templateData.splitViewTitle;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Core.Validator)?.required;

  return (
    <div className="gui-markdown" style={{ flex: templateData.size }}>
      <gui-markdown
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
        counterMode={counterMode}
        minimumHeight={minimumHeight}
        autoGrow={autoGrow}
        maxLength={maxLength}
        tools={tools}
        defaultOpenPreview={defaultOpenPreview}
        headingTitle={headingTitle}
        boldTitle={boldTitle}
        italicTitle={italicTitle}
        quoteTitle={quoteTitle}
        linkTitle={linkTitle}
        orderedListTitle={orderedListTitle}
        unorderedListTitle={unorderedListTitle}
        splitViewTitle={splitViewTitle}
        dependencies={templateData.deps}
        onInput={handleChange}
        onBlur={onBlur}
      ></gui-markdown>
    </div>
  );
}
