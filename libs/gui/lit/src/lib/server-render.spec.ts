import {
  preloadFormWidgets,
  type FormInitConfig,
  type StandardSchemaV1,
  type ValidatorFn,
  type WithWidget,
} from '@golemui/core';
import { renderGuiFormHtml } from '@golemui/lit/ssr';
import type { Type } from '@golemui/lit';
import { beforeAll, describe, expect, it } from 'vitest';
import { widgetLoaders } from './widget.loaders';

/**
 * Server-markup spec against the real widget set: the stub spec in the adapter
 * package proves the mechanism, this one proves the shipped elements render on the
 * server (host classes from connectedCallback, labels, values, no browser globals).
 */

const noopValidators: ValidatorFn<any> = () =>
  ({
    '~standard': {
      version: 1,
      vendor: 'golemui-ssr-spec',
      validate: (value: unknown) => ({ value }),
    },
  }) as StandardSchemaV1;

const config: FormInitConfig<Type<WithWidget>> = {
  formName: 'gui-lit-ssr-form',
  formDef: {
    form: {
      uid: 'root',
      kind: 'layout',
      type: 'flex',
      children: [
        { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
        { kind: 'input', type: 'textinput', path: 'lastName', label: 'Last name' },
        { kind: 'action', type: 'button', label: 'Create account', action: 'submit' },
      ],
    },
  },
  widgetLoaders,
  data: { firstName: 'Ada', lastName: 'Lovelace' },
};

describe('server rendering the gui widget set in plain node', () => {
  let markup = '';

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders });
    markup = await renderGuiFormHtml({ config, validators: noopValidators });
  });

  it('renders the form with its host class and name', () => {
    expect(markup).toMatch(/<gui-core-form[^>]*class="[^"]*gui-form/);
    expect(markup).toMatch(/<form[^>]*id="gui-lit-ssr-form"/);
    expect(markup).not.toContain('Loading form...');
  });

  it('renders the widget elements with their host classes', () => {
    expect(markup).toMatch(/<gui-flex-layout[^>]*class="[^"]*gui-flex[^"]*gui-field/);
    expect(markup).toMatch(/<gui-textinput-input[^>]*class="[^"]*gui-textinput[^"]*gui-field/);
    expect(markup).toMatch(/<gui-button-interactive[^>]*class="[^"]*gui-button[^"]*gui-field/);
  });

  it('renders labels, values and the layout structure', () => {
    expect(markup).toContain('First name');
    expect(markup).toMatch(/<input[^>]*id="firstName-textinput"[^>]*value="Ada"/);
    expect(markup).toMatch(/<input[^>]*id="lastName-textinput"[^>]*value="Lovelace"/);
    expect(markup).toContain('Create account');
    expect(markup).toContain('gui-flex__widget');
  });

  it('emits inert light DOM: defer-hydration everywhere, no shadow root wrappers', () => {
    expect(markup).toMatch(/<gui-core-form[^>]*defer-hydration/);
    expect(markup).toMatch(/<gui-textinput-input[^>]*defer-hydration/);
    expect(markup).not.toContain('<template');
    expect(markup).not.toContain('lit-part');
  });

  it('is deterministic across renders', async () => {
    const second = await renderGuiFormHtml({ config, validators: noopValidators });
    expect(second).toBe(markup);
  });
});
