import type { InputWidget, Validator } from '@golemui/core';
import type { TextinputProps } from '@golemui/gui-shared/internals';
import { useInputWidget } from '@golemui/react';
import { Box, Text } from 'ink';
import { useTheme } from '../theme';
import { Field } from './Field';
import { useFieldFocus } from './useFieldFocus';
import { useTextCursor } from './useTextCursor';

/** Props of {@link SingleLineInput}. */
export type SingleLineInputProps = {
  widget: InputWidget<string>;
  /** One character drawn in place of every character of the text. Omit it to draw the text. */
  mask?: string;
};

/**
 * One line of editable text inside the field chrome. `textinput` and `password` render it.
 *
 * Enter moves focus to the next field, which is how a terminal form replaces clicking away from an
 * input.
 */
export function SingleLineInput({ widget, mask }: SingleLineInputProps) {
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    string,
    TextinputProps
  >(widget);

  const theme = useTheme();
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  const { isFocused, useFocusedInput, focusNext } = useFieldFocus({ uid, isDisabled, onBlur });
  const { text, cursor, handleKey } = useTextCursor({ value, isFocused, onValueChanged });

  useFocusedInput((input, key) => {
    if (key.return) {
      focusNext();
      return;
    }
    if (isReadonly) {
      return;
    }
    handleKey(input, key);
  });

  const placeholder = templateData.placeholder ?? '';
  const showPlaceholder = !isFocused && text === '' && placeholder !== '';
  const shownText = mask === undefined ? text : mask.repeat(text.length);

  return (
    <Field
      theme={theme}
      label={templateData.label as string}
      hint={templateData.hint}
      size={templateData.size}
      isRequired={isRequired}
      isFocused={isFocused}
      isTouched={isTouched}
      errors={errors}
    >
      <Box>
        <Text color={isFocused ? theme.colors.focus : theme.colors.border}>
          {isFocused ? `${theme.glyphs.focusMarker} ` : '  '}
        </Text>
        {showPlaceholder ? (
          <Text color={theme.colors.placeholder}>{placeholder}</Text>
        ) : (
          <Text color={isDisabled ? theme.colors.disabled : theme.colors.value}>
            {shownText.slice(0, cursor)}
            {isFocused ? theme.glyphs.cursor : ''}
            {shownText.slice(cursor)}
          </Text>
        )}
      </Box>
    </Field>
  );
}
