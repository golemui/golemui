import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import type { CheckboxProps } from '@golemui/gui-shared/internals';
import { useInputWidget } from '@golemui/react';
import { Box, Text } from 'ink';
import { Field } from '../internal/Field';
import { useFieldFocus } from '../internal/useFieldFocus';
import { useFocusedInput } from '../internal/useFocusedInput';
import { useTheme } from '../theme';

/**
 * The `checkbox` widget. Space toggles the value. Enter moves to the next field, as in a text
 * field, so a user who walks through the form with Enter does not change the value.
 *
 * The label sits next to the glyph instead of above it, so {@link Field} gets no label and this
 * component draws the label and the required glyph itself.
 */
export function Checkbox(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<boolean>;
  const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
    boolean,
    CheckboxProps
  >(widget);

  const theme = useTheme();
  const isDisabled = templateData.disabled as boolean;
  const isReadonly = templateData.readonly as boolean;
  const isRequired = (templateData.validator as Validator)?.required;

  const { isFocused, focusNext } = useFieldFocus({ uid, isDisabled, onBlur });

  useFocusedInput(uid, {
    onKey: (input, key) => {
      if (key.return) {
        focusNext();
        return;
      }
      if (isReadonly) {
        return;
      }
      if (input === ' ') {
        onValueChanged(!value);
      }
    },
  });

  const glyph = value ? theme.glyphs.checkboxOn : theme.glyphs.checkboxOff;

  return (
    <Field
      theme={theme}
      hint={templateData.hint}
      size={templateData.size}
      isFocused={isFocused}
      isTouched={isTouched}
      errors={errors}
    >
      <Box>
        <Text color={isFocused ? theme.colors.focus : theme.colors.border}>
          {isFocused ? `${theme.glyphs.focusMarker} ` : '  '}
        </Text>
        <Text color={isDisabled ? theme.colors.disabled : theme.colors.value}>{glyph} </Text>
        <Text color={theme.colors.label} bold={isFocused}>
          {templateData.label as string}
          {isRequired ? theme.glyphs.required : ''}
        </Text>
      </Box>
    </Field>
  );
}
