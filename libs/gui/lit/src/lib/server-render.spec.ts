import {
  preloadFormWidgets,
  type FormInitConfig,
  type ValidatorFn,
  type WithWidget,
} from '@golemui/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { renderForm, renderTemplate } from '@golemui/lit/ssr';
import type { Type } from '@golemui/lit';
import { html } from 'lit';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import './components/form.element';
import { resumeFormConfig } from './ssr.fixture';
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
      type: 'grid',
      children: [
        { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
        { kind: 'input', type: 'textinput', path: 'lastName', label: 'Last name' },
        { kind: 'input', type: 'number', path: 'seats', label: 'Seats' },
        // The data values sit in the middle of each option list, so a render that marks the
        // last option or the last radio as selected is distinguishable from a correct one.
        {
          kind: 'input',
          type: 'select',
          path: 'plan',
          label: 'Plan',
          props: {
            options: [
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ],
          },
        },
        {
          kind: 'input',
          type: 'radiogroup',
          path: 'size',
          label: 'Size',
          props: {
            options: [
              { value: 's', label: 'S' },
              { value: 'm', label: 'M' },
              { value: 'l', label: 'L' },
            ],
          },
        },
        { kind: 'input', type: 'checkbox', path: 'acceptTerms', label: 'I accept the terms' },
        { kind: 'input', type: 'toggle', path: 'newsletter', label: 'Newsletter' },
        {
          kind: 'input',
          type: 'currency',
          path: 'budget',
          label: 'Budget',
          props: { currency: 'USD' },
        },
        { kind: 'input', type: 'slider', path: 'volume', label: 'Volume', props: { maximum: 10 } },
        {
          kind: 'input',
          type: 'rangeSlider',
          path: 'price',
          label: 'Price',
          props: { maximum: 500, step: 10 },
        },
        {
          kind: 'input',
          type: 'otp',
          path: 'code',
          label: 'Sign-in code',
          props: { groups: [3, 3] },
        },
        { kind: 'action', type: 'button', label: 'Create account', action: 'submit' },
        {
          uid: 'moreActions',
          kind: 'action',
          type: 'menu',
          label: 'More',
          props: { items: [{ label: 'Save as draft', value: 'draft' }] },
        },
      ],
    },
  },
  widgetLoaders,
  data: {
    firstName: 'Ada',
    code: '123',
    lastName: 'Lovelace',
    seats: 3,
    plan: 'pro',
    size: 'm',
    acceptTerms: false,
    newsletter: false,
    budget: 1234.5,
    volume: 7,
    price: { start: 100, end: 300 },
  },
};

describe('server rendering the gui widget set in plain node', () => {
  let markup = '';

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders });
    markup = await renderForm({ config, validators: noopValidators });
  });

  it('renders the form with its host class and name', () => {
    expect(markup).toMatch(/<gui-core-form[^>]*class="[^"]*gui-form/);
    expect(markup).toMatch(/<form[^>]*id="gui-lit-ssr-form"/);
    expect(markup).not.toContain('Loading form...');
  });

  it('renders the widget elements with their host classes', () => {
    expect(markup).toMatch(/<gui-grid-layout[^>]*class="[^"]*gui-field/);
    expect(markup).toMatch(/<gui-textinput-input[^>]*class="[^"]*gui-textinput[^"]*gui-field/);
    expect(markup).toMatch(/<gui-button-interactive[^>]*class="[^"]*gui-button[^"]*gui-field/);
    expect(markup).toMatch(/<gui-menu-interactive[^>]*class="[^"]*gui-menu-button[^"]*gui-field/);
  });

  it('renders labels, values and the layout structure', () => {
    expect(markup).toContain('First name');
    expect(markup).toMatch(/<input[^>]*id="firstName-textinput"[^>]*value="Ada"/);
    expect(markup).toMatch(/<input[^>]*id="lastName-textinput"[^>]*value="Lovelace"/);
    expect(markup).toContain('Create account');
    expect(markup).toMatch(/<button[^>]*id="moreActions"[^>]*popovertarget="moreActions_menu"/);
    expect(markup).toMatch(/<div[^>]*id="moreActions_menu"[^>]*popover/);
    expect(markup).toContain('Save as draft');
    expect(markup).toMatch(/<div[^>]*class="gui-grid"/);
    expect(markup).toMatch(/<div[^>]*class="gui-grid__cell"/);
  });

  it('renders the number widget, which reads the DOM in render()', () => {
    // It looks the input up with querySelector to measure it, which the element shim on
    // the server does not implement.
    expect(markup).toMatch(/<gui-number-input[^>]*class="[^"]*gui-number[^"]*gui-field/);
    expect(markup).toContain('Seats');
    expect(markup).toMatch(/<input[^>]*type="number"[^>]*id="seats-number"/);
  });

  it('renders the slider widgets with their values in their range inputs and labels', () => {
    expect(markup).toMatch(/<gui-slider-input[^>]*class="[^"]*gui-slider[^"]*gui-field/);
    expect(markup).toMatch(/<input[^>]*type="range"[^>]*id="volume-slider"[^>]*value="7"/);
    expect(markup).toMatch(
      /<gui-range-slider-input[^>]*class="[^"]*gui-range-slider[^"]*gui-field/,
    );
    expect(markup).toMatch(
      /<input[^>]*type="range"[^>]*id="price-rangeSlider_start"[^>]*value="100"/,
    );
    expect(markup).toMatch(
      /<input[^>]*type="range"[^>]*id="price-rangeSlider_end"[^>]*value="300"/,
    );
    expect(markup).toMatch(
      /class="gui-slider__value"[^>]*>(<!--[^>]*-->)*7(<!--[^>]*-->)*<\/output>/,
    );
    expect(markup).toMatch(/class="gui-slider__value"[^>]*>(<!--[^>]*-->)*100 – 300/);
  });

  it('renders the otp widget with its digits in its boxes and its input', () => {
    expect(markup).toMatch(/<gui-otp-input[^>]*class="[^"]*gui-otp[^"]*gui-field/);
    expect(markup).toMatch(/<input[^>]*id="code-otp"[^>]*autocomplete="one-time-code"/);
    expect(markup).toMatch(/<input[^>]*id="code-otp"[^>]*value="123"/);
    expect(markup.match(/gui-otp__box--filled/g)).toHaveLength(3);
    expect(markup).toContain('class="gui-otp__separator"');
  });

  it('renders the currency widget, which reads its own children in willUpdate()', () => {
    // It formats the value unless its own input has focus, so it calls querySelector on the
    // element itself. Without the element shim the server render throws here.
    expect(markup).toMatch(/<gui-currency-input[^>]*class="[^"]*gui-currency[^"]*gui-field/);
    expect(markup).toContain('Budget');
    expect(markup).toMatch(/<input[^>]*type="number"[^>]*id="budget-currency"/);
    expect(markup).toContain('$1,234.50');
  });

  // @lit-labs/ssr serializes a false `.selected` or `.checked` property as `name="false"`,
  // and HTML reads any present boolean attribute as true. renderTemplate removes those.
  it('renders exactly one selected option and no false-valued selected attribute', () => {
    expect(markup).not.toMatch(/\sselected="false"/);
    const selectedOptions = markup.match(/<option[^>]*\sselected=[^>]*>/g) ?? [];
    expect(selectedOptions).toHaveLength(1);
    expect(selectedOptions[0]).toMatch(/value="pro"/);
  });

  it('renders the unchecked checkbox, toggle and radios without a checked attribute', () => {
    expect(markup).not.toMatch(/\schecked="false"/);
    expect(markup).toMatch(/<input[^>]*type="checkbox"[^>]*id="acceptTerms-checkbox"/);
    expect(markup).not.toMatch(/<input[^>]*id="acceptTerms-checkbox"[^>]*\schecked=/);
    expect(markup).not.toMatch(/<input[^>]*id="newsletter-toggle"[^>]*\schecked=/);
    const checkedRadios = markup.match(/<input[^>]*type="radio"[^>]*\schecked=[^>]*>/g) ?? [];
    expect(checkedRadios).toHaveLength(1);
    expect(checkedRadios[0]).toMatch(/value="m"/);
  });

  it('emits inert light DOM: defer-hydration everywhere, no shadow root wrappers', () => {
    expect(markup).toMatch(/<gui-core-form[^>]*defer-hydration/);
    expect(markup).toMatch(/<gui-textinput-input[^>]*defer-hydration/);
    expect(markup).not.toContain('<template');
    expect(markup).not.toContain('lit-part');
  });

  it('is deterministic across renders', async () => {
    const second = await renderForm({ config, validators: noopValidators });
    expect(second).toBe(markup);
  });
});

describe('server rendering the fields inside a tabs layout', () => {
  // gui-tabs and its parts are not LitElements, so the server renders their tags only: the
  // fields in a panel still reach the form context through the tabs layout element.
  const tabsConfig: FormInitConfig<Type<WithWidget>> = {
    formName: 'gui-lit-ssr-tabs',
    formDef: {
      form: {
        uid: 'root',
        kind: 'layout',
        type: 'tabs',
        props: {
          tabs: [
            { label: 'Personal', uid: 'personal' },
            { label: 'Company', uid: 'company' },
          ],
        },
        children: [
          {
            uid: 'personal',
            kind: 'layout',
            type: 'grid',
            children: [
              { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
            ],
          },
          {
            uid: 'company',
            kind: 'layout',
            type: 'grid',
            children: [{ kind: 'input', type: 'textinput', path: 'company', label: 'Company' }],
          },
        ],
      },
    },
    widgetLoaders,
    data: { firstName: 'Ada', company: 'Analytical Engines' },
  };

  it('renders the fields of every panel with their values', async () => {
    await preloadFormWidgets({ widgetLoaders });
    const markup = await renderForm({ config: tabsConfig, validators: noopValidators });
    expect(markup).toMatch(/<gui-tab-panel[^>]*>/);
    expect(markup).toMatch(/<input[^>]*id="firstName-textinput"[^>]*value="Ada"/);
    expect(markup).toMatch(/<input[^>]*id="company-textinput"[^>]*value="Analytical Engines"/);
  });
});

describe('server rendering the gui-form element', () => {
  let markup = '';

  beforeAll(async () => {
    await preloadFormWidgets({ widgetLoaders });
    markup = await renderTemplate(html`<gui-form .config=${resumeFormConfig}></gui-form>`);
  });

  // The resume spec loads this file into a DOM. Run vitest with `-u` to update it. The file has
  // no trailing spaces and ends with a newline, as an editor saves it (.editorconfig).
  it('matches the golden markup the resume spec loads', async () => {
    await expect(`${markup.replace(/[ \t]+$/gm, '')}\n`).toMatchFileSnapshot(
      join(__dirname, 'goldens/resume-form.html'),
    );
  });

  it('renders the widgets with their values inside the inert gui-form', () => {
    expect(markup).toMatch(/<gui-form[^>]*defer-hydration/);
    expect(markup).toMatch(/<gui-core-form[^>]*defer-hydration/);
    expect(markup).toMatch(/<input[^>]*id="firstName-textinput"[^>]*value="Ada"/);
    expect(markup).toMatch(/<input[^>]*type="number"[^>]*id="seats-number"/);
    expect(markup).toMatch(/<input[^>]*type="checkbox"[^>]*id="acceptTerms-checkbox"[^>]*checked/);
    expect(markup).toContain('Send');
  });
});
