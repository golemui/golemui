import type { InputWidget, WithWidget } from '@golemui/core';
import { SingleLineInput } from '../internal/SingleLineInput';

/**
 * The `textinput` widget. Enter moves focus to the next field, which is how a terminal form
 * replaces clicking away from an input.
 */
export function TextInput(widgetInstance: WithWidget) {
  return <SingleLineInput widget={widgetInstance.widget as InputWidget<string>} />;
}
