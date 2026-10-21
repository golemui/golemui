import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/menu.schema.json';

const menu = (overrides: Record<string, unknown> = {}, props: Record<string, unknown> = {}) => ({
  uid: 'rowActions',
  kind: 'action',
  type: 'menu',
  label: 'Actions',
  props: {
    items: [
      { label: 'Edit', value: 'edit' },
      { separator: true },
      { label: 'Delete', value: 'delete', disabled: true },
    ],
    ...props,
  },
  ...overrides,
});

describe('Menu schema validation', () => {
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
    it('validates a menu with actions and a separator', () => {
      expectValid(menu());
    });

    it('validates every prop, the click event and state suffixes', () => {
      expectValid(
        menu(
          {
            on: { click: 'rowAction' },
            disabled: { when: '$formIsInvalid' },
            'label.editing': 'Busy',
          },
          {
            placement: 'bottom-end',
            variant: 'outlined',
            icon: 'more_vert',
            iconPosition: 'right',
            'placement.compact': 'top-end',
          },
        ),
      );
    });

    it('validates an icon-only menu named by ariaLabel, with no label', () => {
      const { label: _label, ...iconOnly } = menu(
        {},
        { icon: 'more_vert', ariaLabel: 'Row actions' },
      );
      expectValid(iconOnly);
    });

    it('validates translation configs as the button and item labels', () => {
      expectValid(
        menu(
          { label: { key: 'actions.title' } },
          { items: [{ label: { key: 'actions.edit', default: 'Edit' }, value: 'edit' }] },
        ),
      );
    });
  });

  describe('Invalid configurations', () => {
    it.each([
      ['no props', { props: undefined }, {}],
      ['no items', {}, { items: undefined }],
      ['no items in the list', {}, { items: [] }],
      ['an item with no value', {}, { items: [{ label: 'Edit' }] }],
      ['an item with an unknown field', {}, { items: [{ label: 'Edit', value: 'e', icon: 'x' }] }],
      ['a separator with a label', {}, { items: [{ separator: true, label: 'Group' }] }],
      ['an unknown placement', {}, { placement: 'left' }],
      ['an unknown prop', {}, { size: 'sm' }],
    ])('rejects %s', (_name, overrides, props) => {
      const widget = menu(overrides, props) as Record<string, any>;
      // An undefined override stands for a missing field.
      Object.keys(widget).forEach((key) => widget[key] === undefined && delete widget[key]);
      Object.keys(widget['props'] ?? {}).forEach(
        (key) => widget['props'][key] === undefined && delete widget['props'][key],
      );

      expect(validate(widget)).toBe(false);
    });
  });
});
