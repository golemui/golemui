import type {
  ActionWidget,
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import { Box, Text, useFocus, useInput } from 'ink';
import WidgetRenderer from './WidgetRenderer';
import type { WidgetErrorFallback } from './WidgetErrorBoundary';
import { useActionWidget } from './hooks/useActionWidget';
import { useInputWidget } from './hooks/useInputWidget';
import { useLayoutWidget } from './hooks/useLayoutWidget';

/**
 * Stub widgets and form definitions for the Ink specs.
 *
 * The widgets render Ink elements only, and they read and write the store through the
 * real hooks and the real WidgetRenderer. A value that reaches a frame took the same path
 * the shipped widgets take.
 */

/** Renders `label: value`, marks focus with a leading `>`, and appends every typed character to the value while focused. */
function InkStubTextInput(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as InputWidget<string, string>;
  const { uid, value, templateData, onValueChanged } = useInputWidget<string, Record<string, any>>(
    widget,
  );
  const { isFocused } = useFocus({ id: uid, autoFocus: true });

  useInput(
    (input, key) => {
      // Tab and Enter carry no printable character, the focus manager and the button handle them.
      if (key.tab || key.return || input.length === 0) {
        return;
      }
      onValueChanged((value ?? '') + input);
    },
    { isActive: isFocused },
  );

  return (
    <Text>
      {isFocused ? '> ' : ''}
      {String(templateData.label ?? '')}: {value ?? ''}
    </Text>
  );
}

/** Renders `[label]`, marks focus with a leading `>`, and runs the click and the submit of the action on Enter while focused. */
function InkStubButton(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as ActionWidget<string>;
  const { uid, templateData, onClick, onSubmit } = useActionWidget<Record<string, any>>(widget);
  const { isFocused } = useFocus({ id: uid });

  useInput(
    (_input, key) => {
      if (!key.return) {
        return;
      }
      onClick();
      if (widget.actionType === 'submit') {
        onSubmit();
      }
    },
    { isActive: isFocused },
  );

  return (
    <Text>
      {isFocused ? '> ' : ''}[{String(templateData.label ?? '')}]
    </Text>
  );
}

/** Stacks its children in a column. */
function InkStubFlex(widgetInstance: WithWidget) {
  const { children } = useLayoutWidget<Record<string, any>>(
    widgetInstance.widget as LayoutWidget<string>,
  );

  return (
    <Box flexDirection="column">
      {(children as NonFunctionWidget<string>[]).map((child) => (
        <WidgetRenderer key={child.uid} widget={child} />
      ))}
    </Box>
  );
}

/** Always throws, so a spec can assert on the widget error fallback. */
function InkStubThrowingWidget(): never {
  throw new Error('stub widget failed on purpose');
}

type StubComponent = React.ComponentType<WithWidget>;

export const inkStubWidgetLoaders = {
  textinput: async (): Promise<StubComponent> => InkStubTextInput,
  button: async (): Promise<StubComponent> => InkStubButton,
  flex: async (): Promise<StubComponent> => InkStubFlex,
  throwing: async (): Promise<StubComponent> => InkStubThrowingWidget as StubComponent,
};

/** Accepts everything. The specs assert on frames and events, not on validation. */
export const noopValidators: ValidatorFn<any> = () =>
  ({
    '~standard': {
      version: 1,
      vendor: 'golemui-ink-fixture',
      validate: (value: unknown) => ({ value }),
    },
  }) as ReturnType<ValidatorFn<any>>;

/** The text the injected widget error fallback renders, unique enough to search a frame for. */
export const widgetErrorFallbackMarker = 'INK FALLBACK';

/** Renders the marker plus the widget type, so a frame proves which widget threw. */
export const inkWidgetErrorFallback: WidgetErrorFallback = (_error, widget) => (
  <Text>
    {widgetErrorFallbackMarker} {widget.type}
  </Text>
);

/** Both widgets carry a `load` handler, so a lost `load` event fails a spec. */
export function buildInkConfig(): FormInitConfig<StubComponent> {
  return {
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'flex',
        children: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'firstName',
            label: 'First name',
            on: { load: 'textLoaded' },
          },
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            label: 'Send',
            on: { load: 'buttonLoaded' },
          },
        ],
      },
    },
    widgetLoaders: inkStubWidgetLoaders,
    data: {},
  };
}

/** One throwing widget next to a working one, so a spec sees the fallback and the rest of the tree. */
export function buildThrowingInkConfig(): FormInitConfig<StubComponent> {
  return {
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'flex',
        children: [
          { kind: 'display', type: 'throwing' },
          { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
        ],
      },
    },
    widgetLoaders: inkStubWidgetLoaders,
    data: { firstName: 'Ada' },
  };
}

/** A widget type with no loader next to a working one, so the form health turns errored while the rest of the tree renders. */
export function buildMissingLoaderInkConfig(): FormInitConfig<StubComponent> {
  return {
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'flex',
        children: [
          { kind: 'display', type: 'missing' },
          { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
        ],
      },
    },
    widgetLoaders: inkStubWidgetLoaders,
    data: { firstName: 'Ada' },
  };
}
