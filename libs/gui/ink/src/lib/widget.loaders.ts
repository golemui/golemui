import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { ComponentType } from 'react';

/**
 * The widget types this set implements.
 *
 * The full `GolemWidget` union would require a loader for every catalog type, and `Partial<...>`
 * would accept a misspelled key. A form that uses another type fails through form health with a
 * message that names the type.
 */
export type InkWidgetType =
  | 'button'
  | 'checkbox'
  | 'flex'
  | 'grid'
  | 'markdownText'
  | 'password'
  | 'textinput';

/** Lazy loaders for every widget the ink set renders, keyed by widget type. */
export const widgetLoaders: WidgetLoaders<ComponentType<WithWidget>, InkWidgetType> = {
  // INTERACTIVE
  button: async () => (await import('./components/Button')).Button,

  // CONTROLS
  checkbox: async () => (await import('./components/Checkbox')).Checkbox,
  password: async () => (await import('./components/Password')).Password,
  textinput: async () => (await import('./components/TextInput')).TextInput,

  // LAYOUTS
  flex: async () => (await import('./components/Grid')).Grid,
  grid: async () => (await import('./components/Grid')).Grid,

  // DISPLAY
  markdownText: async () => (await import('./components/MarkdownText')).MarkdownText,
};
