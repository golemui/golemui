import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/react';
import { type TagsProps } from '@golemui/gui-shared';
import { useCallback } from 'react';
import '@golemui/gui-components/tags';
import '../styles.scss';

export function Tags(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string[]>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string[],
    TagsProps
  >(widget);

  const handleChange = useCallback(
    (e: React.SyntheticEvent<HTMLElement>) =>
      onValueChanged((e.nativeEvent as CustomEvent).detail.value),
    [onValueChanged],
  );

  const label = templateData.label as string;
  const hint = templateData.hint;
  const placeholder = templateData.placeholder;
  const icon = templateData.icon;
  const separators = templateData.separators;
  const allowDuplicates = templateData.allowDuplicates ?? true;
  const trim = templateData.trim ?? true;
  const limit = templateData.limit;
  const removeAriaLabel = templateData.removeAriaLabel;
  const removeIcon = templateData.removeIcon;
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  return (
    <div className="gui-tags gui-field" style={{ flex: templateData.size }}>
      <gui-tags
        uid={uid}
        label={label}
        hint={hint}
        errors={errors}
        touched={isTouched}
        required={isRequired}
        disabled={isDisabled}
        readOnly={isReadonly}
        value={value}
        placeholder={placeholder ?? undefined}
        icon={icon}
        separators={separators}
        allowDuplicates={allowDuplicates}
        trim={trim}
        limit={limit}
        removeAriaLabel={removeAriaLabel}
        removeIcon={removeIcon}
        onChange={handleChange}
        onBlur={onBlur}
      ></gui-tags>
    </div>
  );
}
