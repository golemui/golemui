import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/menu.schema.json';

const menu = (overrides: Record<string, unknown> = {}, props: Record<string, unknown> = {}) => ({
  uid: 'main',
  kind: 'action',
  type: 'menu',
  label: 'Main',
  props: {
    items: [
      { label: 'Orders', value: 'orders', icon: 'receipt_long' },
      {
        label: 'Settings',
        value: 'settings',
        items: [
          { label: 'Profile', value: 'profile' },
          {
            label: 'Billing',
            value: 'billing',
            items: [{ label: 'Cards', value: 'cards', disabled: true }],
          },
        ],
      },
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

  /** Builds the widget, dropping the fields an override sets to undefined. */
  const without = (widget: Record<string, any>) => {
    Object.keys(widget).forEach((key) => widget[key] === undefined && delete widget[key]);
    Object.keys(widget['props'] ?? {}).forEach(
      (key) => widget['props'][key] === undefined && delete widget['props'][key],
    );
    return widget;
  };

  describe('Valid configurations', () => {
    it('validates a menu with groups three levels deep', () => {
      expectValid(menu());
    });

    it('validates every prop, the click event and state suffixes', () => {
      expectValid(
        menu(
          {
            on: { click: 'navigate' },
            disabled: { when: '$formIsInvalid' },
            'label.compact': 'Nav',
          },
          {
            orientation: 'horizontal',
            current: '{{ $meta.view }}',
            'orientation.compact': 'vertical',
            'current.compact': 'orders',
          },
        ),
      );
    });

    it('validates translation configs as the labels, nested ones too', () => {
      expectValid(
        menu(
          { label: { key: 'nav.main' } },
          {
            items: [
              {
                label: { key: 'nav.settings' },
                value: 'settings',
                items: [{ label: { key: 'nav.profile', default: 'Profile' }, value: 'profile' }],
              },
            ],
          },
        ),
      );
    });
  });

  describe('Invalid configurations', () => {
    it.each([
      ['no props', { props: undefined }, {}],
      ['no items', {}, { items: undefined }],
      ['no items in the list', {}, { items: [] }],
      ['an item with no value', {}, { items: [{ label: 'Orders' }] }],
      ['an empty group', {}, { items: [{ label: 'Settings', value: 's', items: [] }] }],
      [
        'a nested item with an unknown field',
        {},
        { items: [{ label: 'S', value: 's', items: [{ label: 'P', value: 'p', href: '/p' }] }] },
      ],
      ['a separator, which only menuButton has', {}, { items: [{ separator: true }] }],
      ['an unknown orientation', {}, { orientation: 'row' }],
      ["menuButton's placement", {}, { placement: 'bottom-end' }],
      ['a number as current', {}, { current: 3 }],
    ])('rejects %s', (_name, overrides, props) => {
      expect(validate(without(menu(overrides, props)))).toBe(false);
    });
  });
});
