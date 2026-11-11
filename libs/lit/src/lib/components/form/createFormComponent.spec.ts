// @vitest-environment jsdom
import { preloadFormWidgets, type WithWidget } from '@golemui/core';
import { safeDefine } from '@golemui/lit-utils';
import { html } from 'lit';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { afterLitRenderSchedule, noopValidators, stubWidgetLoaders } from '../../ssr.fixture';
import type { Type } from '../../utils/type';
import { createFormComponent, type WidgetSetFormElement } from './createFormComponent';
import type { FormElement } from './form.element';
import type { FormHealthBoundary } from './form-health-boundary';

const WidgetSetForm = createFormComponent<any>({
  widgetLoaders: stubWidgetLoaders as Record<string, () => Promise<Type<WithWidget>>>,
  validators: () => noopValidators,
});
safeDefine('create-form-component-spec-form', WidgetSetForm);

class WidgetSetFormSubclass extends WidgetSetForm {
  override firstUpdated() {
    this.dataset['rendered'] = 'true';
  }
}
safeDefine('create-form-component-spec-subclass', WidgetSetFormSubclass);

const formDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [{ uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' }],
  },
};

const createWrapper = () => {
  const wrapper = document.createElement('create-form-component-spec-form') as WidgetSetFormElement;
  wrapper.config = { formDef, data: {} };
  return wrapper;
};

beforeAll(async () => {
  await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('setData and setMeta on a form element built by createFormComponent', () => {
  const coreStoreState = (wrapper: WidgetSetFormElement) =>
    (wrapper.querySelector('gui-core-form') as FormElement).context.store.getState();

  it('keeps a setData call made before the element is in the page', async () => {
    const wrapper = createWrapper();

    wrapper.setData({ firstName: 'Bob' });
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });

  it('keeps a setData call made after the element is in the page but before its first update', async () => {
    const wrapper = createWrapper();
    document.body.append(wrapper);

    wrapper.setData({ firstName: 'Bob' });
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });

  it('keeps a setMeta call made before the element is in the page', async () => {
    const wrapper = createWrapper();

    wrapper.setMeta({ tier: 'paid' });
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).meta).toEqual({ tier: 'paid' });
  });

  it('keeps a setHealth call made before the element is in the page', async () => {
    const wrapper = createWrapper();

    wrapper.setHealth({ status: 'errored' as const, code: 10_001, message: 'Set early' });
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).formHealth).toEqual({
      status: 'errored' as const,
      code: 10_001,
      message: 'Set early',
    });
  });

  it('keeps an early setData call in a subclass that has its own firstUpdated', async () => {
    const wrapper = document.createElement(
      'create-form-component-spec-subclass',
    ) as WidgetSetFormElement;
    wrapper.config = { formDef, data: {} };

    wrapper.setData({ firstName: 'Bob' });
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });

  it('applies a setData call after the start at once', async () => {
    const wrapper = createWrapper();
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    wrapper.setData({ firstName: 'Bob' });

    expect(coreStoreState(wrapper).data).toEqual({ firstName: 'Bob' });
  });
});

describe('a form element built by createFormComponent', () => {
  it('passes the autocomplete HTML attribute to the inner form element', async () => {
    const wrapper = createWrapper();
    wrapper.setAttribute('autocomplete', 'off');
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(wrapper.querySelector('form')?.getAttribute('autocomplete')).toBe('off');

    wrapper.setAttribute('autocomplete', 'on');
    await afterLitRenderSchedule();

    expect(wrapper.querySelector('form')?.getAttribute('autocomplete')).toBe('on');
  });

  it('renders the inner form without autocomplete when the attribute is not set', async () => {
    const wrapper = createWrapper();
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    expect(wrapper.querySelector('form')).not.toBeNull();
    expect(wrapper.querySelector('form')?.hasAttribute('autocomplete')).toBe(false);
  });

  it('passes the formHealthBoundary property to gui-core-form, which renders the form through it', async () => {
    const boundary: FormHealthBoundary = ({ health, form }) =>
      html`<section class="custom-boundary" data-status=${health.status}>${form}</section>`;
    const wrapper = createWrapper();
    wrapper.formHealthBoundary = boundary;
    document.body.append(wrapper);
    await afterLitRenderSchedule();

    const coreForm = wrapper.querySelector('gui-core-form') as FormElement;
    expect(coreForm.formHealthBoundary).toBe(boundary);
    const section = wrapper.querySelector('section.custom-boundary');
    expect(section?.getAttribute('data-status')).toBe('ok');
    expect(section?.querySelector('form input')?.id).toBe('firstName');
  });
});
