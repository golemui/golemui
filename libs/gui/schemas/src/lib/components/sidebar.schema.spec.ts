import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import { golemForm } from '@golemui/gui-shared/internals';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/sidebar.schema.json';

const nav = {
  uid: 'nav',
  kind: 'action',
  type: 'menu',
  label: 'Main',
  props: { items: [{ label: 'Orders', value: 'orders' }] },
};
const content = {
  uid: 'content',
  kind: 'layout',
  type: 'grid',
  children: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name' }],
};

const sidebar = (overrides: Record<string, unknown> = {}) => ({
  uid: 'shell',
  kind: 'layout',
  type: 'sidebar',
  children: [nav, content],
  ...overrides,
});

describe('Sidebar schema validation', () => {
  let validate: GetSchema;

  beforeEach(() => {
    const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
    registerGolemSchemas(ajv);
    validate = ajv.getSchema(SCHEMA_ID_UNDER_TEST) as GetSchema;
    if (!validate) {
      throw new Error(`Schema ${SCHEMA_ID_UNDER_TEST} was not found in the registry.`);
    }
  });

  const expectValid = (widget: unknown) => {
    const isValid = validate(widget);
    if (!isValid) specValidationErrorsLogger(validate, widget);
    expect(isValid).toBe(true);
  };

  describe('Valid configurations', () => {
    it('validates a minimal sidebar, typed through golemForm', () => {
      const formDef = golemForm().create({
        form: [
          {
            uid: 'shell',
            kind: 'layout',
            type: 'sidebar',
            children: [
              {
                uid: 'nav',
                kind: 'action',
                type: 'menu',
                label: 'Main',
                props: { items: [{ label: 'Orders', value: 'orders' }] },
              },
              { uid: 'name', kind: 'input', type: 'textinput', path: 'name' },
            ],
          },
        ],
      });

      expectValid(formDef.form.children[0]);
    });

    it('validates every prop, state suffixes and the change event', () => {
      expectValid(
        sidebar({
          on: { change: 'drawerToggled' },
          props: {
            side: 'end',
            sideSize: 'lg',
            sideLabel: { key: 'nav.main' },
            toggleLabel: 'Open the menu',
            'side.compact': 'start',
            'sideSize.compact': 'sm',
            'sideLabel.compact': 'Nav',
            'toggleLabel.compact': 'Menu',
          },
        }),
      );
    });

    it('validates a sidebar deeper in the main region', () => {
      expectValid(sidebar({ children: [nav, sidebar({ uid: 'inner' })] }));
    });
  });

  describe('Invalid configurations', () => {
    it.each([
      ['one child', { children: [nav] }],
      ['three children', { children: [nav, content, { ...content, uid: 'more' }] }],
      ['no children', { children: undefined }],
      ['a sidebar as the side region', { children: [sidebar({ uid: 'inner' }), content] }],
      ['an unknown side', { props: { side: 'left' } }],
      ['an unknown side size', { props: { sideSize: 'xl' } }],
      ['an unknown prop', { props: { threshold: 768 } }],
    ])('rejects %s', (_name, overrides) => {
      const widget = sidebar(overrides) as Record<string, unknown>;
      Object.keys(widget).forEach((key) => widget[key] === undefined && delete widget[key]);
      expect(validate(widget)).toBe(false);
    });
  });
});
