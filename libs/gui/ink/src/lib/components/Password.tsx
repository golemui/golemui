import type { InputWidget, WithWidget } from '@golemui/core';
import { SingleLineInput } from '../internal/SingleLineInput';

const MASK_CHARACTER = '*';

/**
 * The `password` widget. It behaves like `textinput` but every character is drawn as `*`.
 * There is no reveal toggle, so `showPasswordIcon` and the related props are ignored.
 */
export function Password(widgetInstance: WithWidget) {
  return (
    <SingleLineInput widget={widgetInstance.widget as InputWidget<string>} mask={MASK_CHARACTER} />
  );
}
