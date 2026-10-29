// @vitest-environment jsdom
import {
  enableDevMode,
  type FormInitConfig,
  preloadFormWidgets,
  type WithWidget,
} from '@golemui/core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFormComponent } from './createFormComponent';
import { FormComponent } from './FormComponent';
import type { FormHealthBoundary } from './FormHealthBoundary';
import {
  type InputHookOutput,
  lastHookOutput,
  noopValidators,
  stubWidgetLoaders,
} from './ssr.fixture';
import type { WidgetErrorFallback } from './WidgetErrorBoundary';

type StubComponent = React.ComponentType<WithWidget>;

function ThrowingWidget(): ReactNode {
  throw new Error('render failed');
}

const widgetLoaders = {
  ...stubWidgetLoaders,
  throwing: async (): Promise<StubComponent> => ThrowingWidget,
};

const rootLayout = (children: unknown[]) => ({
  form: { uid: 'root', kind: 'layout', type: 'flex', children },
});

const firstNameInput = { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' };
const throwingWidget = { uid: 'broken', kind: 'input', type: 'throwing', path: 'broken' };

const formDefWithThrowingWidget = rootLayout([throwingWidget, firstNameInput]);

const configWithThrowingWidget = (): FormInitConfig<StubComponent> => ({
  formDef: formDefWithThrowingWidget,
  widgetLoaders,
  data: { firstName: 'Ada' },
});

const fallbackFor =
  (name: string): WidgetErrorFallback =>
  (error, widget) => (
    <p className="custom-fallback" data-fallback={name}>
      {widget.type}[{widget.uid}]: {error.message}
    </p>
  );

const widgetSetForm = (options?: Parameters<typeof createFormComponent>[1]) =>
  createFormComponent({ widgetLoaders, validators: () => noopValidators }, options);

let root: Root;
let container: HTMLDivElement;

const render = (element: ReactNode) => act(async () => root.render(element));

const firstNameValue = () =>
  container.querySelector<HTMLInputElement>('input[name="firstName"]')?.value;

const setFirstNameValue = (value: string) =>
  act(async () => lastHookOutput<InputHookOutput<string>>('firstName').onValueChanged(value));

beforeAll(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await preloadFormWidgets({ widgetLoaders });
});

beforeEach(() => {
  // React and the error boundary log the caught error, which is expected here.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe('a widget that throws while rendering', () => {
  it('renders the default fallback with the widget type, the uid and the message', async () => {
    await render(<FormComponent config={configWithThrowingWidget()} validators={noopValidators} />);

    const formText = container.querySelector('form')?.textContent;
    expect(formText).toContain('Component throwing[broken] failed with:');
    expect(formText).toContain('render failed');
  });

  it('keeps its sibling rendered, and the sibling takes a new value', async () => {
    await render(<FormComponent config={configWithThrowingWidget()} validators={noopValidators} />);
    expect(firstNameValue()).toBe('Ada');

    await setFirstNameValue('Grace');

    expect(firstNameValue()).toBe('Grace');
  });

  it('renders the widgetErrorFallback prop instead of the default fallback', async () => {
    await render(
      <FormComponent
        config={configWithThrowingWidget()}
        validators={noopValidators}
        widgetErrorFallback={fallbackFor('prop')}
      />,
    );

    const fallback = container.querySelector('.custom-fallback');
    expect(fallback?.textContent).toBe('throwing[broken]: render failed');
    expect(container.textContent).not.toContain('failed with:');
  });
});

describe('the options of createFormComponent', () => {
  it('uses the widgetErrorFallback option when the form has no prop', async () => {
    const OptionForm = widgetSetForm({ widgetErrorFallback: fallbackFor('option') });

    await render(<OptionForm config={{ formDef: formDefWithThrowingWidget }} />);

    expect(container.querySelector('.custom-fallback')?.getAttribute('data-fallback')).toBe(
      'option',
    );
  });

  it('uses the widgetErrorFallback prop over the option', async () => {
    const OptionForm = widgetSetForm({ widgetErrorFallback: fallbackFor('option') });

    await render(
      <OptionForm
        config={{ formDef: formDefWithThrowingWidget }}
        widgetErrorFallback={fallbackFor('prop')}
      />,
    );

    expect(container.querySelector('.custom-fallback')?.getAttribute('data-fallback')).toBe('prop');
  });

  it('uses the formHealthBoundary prop over the option', async () => {
    const boundaryFor =
      (name: string): FormHealthBoundary =>
      ({ health, children }) => (
        <section className="custom-boundary" data-boundary={name} data-status={health.status}>
          {children}
        </section>
      );
    const OptionForm = widgetSetForm({ formHealthBoundary: boundaryFor('option') });

    await render(<OptionForm config={{ formDef: rootLayout([firstNameInput]) }} />);
    expect(container.querySelector('.custom-boundary')?.getAttribute('data-boundary')).toBe(
      'option',
    );

    await render(
      <OptionForm
        config={{ formDef: rootLayout([firstNameInput]) }}
        formHealthBoundary={boundaryFor('prop')}
      />,
    );
    expect(container.querySelector('.custom-boundary')?.getAttribute('data-boundary')).toBe('prop');
  });

  it('renders the widgets without the div.gui-form and form wrapper with the headless option', async () => {
    const HeadlessForm = widgetSetForm({ headless: true });
    const DomForm = widgetSetForm();

    await render(<HeadlessForm config={{ formDef: rootLayout([firstNameInput]) }} />);
    expect(container.querySelector('input[name="firstName"]')).not.toBeNull();
    expect(container.querySelector('.gui-form')).toBeNull();
    expect(container.querySelector('form')).toBeNull();

    await render(<DomForm config={{ formDef: rootLayout([firstNameInput]) }} />);
    expect(container.querySelector('.gui-form > form input[name="firstName"]')).not.toBeNull();
  });
});

// Dev mode cannot be turned off again, so these tests run last in this file.
describe('a widget prop named like a widget field, in dev mode', () => {
  beforeAll(() => {
    enableDevMode();
  });

  it('renders the fallback of that widget and keeps its sibling', async () => {
    const config: FormInitConfig<StubComponent> = {
      formDef: rootLayout([
        {
          uid: 'lastName',
          kind: 'input',
          type: 'textinput',
          path: 'lastName',
          props: { path: 'x' },
        },
        firstNameInput,
      ]),
      widgetLoaders,
      data: { firstName: 'Ada' },
    };

    await render(<FormComponent config={config} validators={noopValidators} />);

    const formText = container.querySelector('form')?.textContent;
    expect(formText).toContain('Component textinput[lastName] failed with:');
    expect(formText).toContain(
      '[GolemUI] Widget "lastName": prop keys [path] collide with widget fields',
    );
    expect(firstNameValue()).toBe('Ada');
  });
});
