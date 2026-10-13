import type { ActionWidget, WithWidget } from '@golemui/core';
import type { ButtonProps } from '@golemui/gui-shared/internals';
import { useActionWidget } from '@golemui/react';
import { Box, Text } from 'ink';
import { useFieldFocus } from '../internal/useFieldFocus';
import { useTheme } from '../theme';

/**
 * The `button` widget, drawn as a bracketed label. Focus shows as the focus marker in front of it,
 * like every other widget, plus inverse video for a terminal with colors. Enter and Space both
 * activate it.
 *
 * `variant`, `icon` and `iconPosition` have no terminal equivalent and are ignored.
 */
export function Button(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget;
  const { uid, templateData, onClick, onSubmit } = useActionWidget<ButtonProps>(widget);

  const theme = useTheme();
  const isDisabled = templateData.disabled as boolean;
  const { isFocused, useFocusedInput } = useFieldFocus({ uid, isDisabled });

  useFocusedInput((input, key) => {
    if (!key.return && input !== ' ') {
      return;
    }
    // The click event is what a host listens to, so it is emitted before the submit runs
    // validation and possibly reports the form as invalid. `onSubmit` does nothing for an action
    // that is not a submit.
    onClick();
    onSubmit();
  });

  return (
    <Box flexGrow={templateData.size ?? 1} flexBasis={0}>
      <Text color={isFocused ? theme.colors.focus : theme.colors.border}>
        {isFocused ? `${theme.glyphs.focusMarker} ` : '  '}
      </Text>
      <Text
        color={isDisabled ? theme.colors.disabled : theme.colors.value}
        inverse={isFocused && !isDisabled}
      >
        [ {templateData.label as string} ]
      </Text>
    </Box>
  );
}
