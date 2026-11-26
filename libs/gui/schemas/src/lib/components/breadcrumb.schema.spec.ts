import Ajv2020 from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type GetSchema,
  registerGolemSchemas,
  specValidationErrorsLogger,
} from '../schema.spec.utils';

const SCHEMA_ID_UNDER_TEST = 'https://golemui.com/schemas/gui/components/breadcrumb.schema.json';

const breadcrumb = (
  overrides: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
) => ({
  uid: 'trail',
  kind: 'action',
  type: 'breadcrumb',
  props: {
    items: [
      { label: 'Orders', value: 'orders' },
      { label: 'A-1042', value: 'order' },
    ],
    ...props,
  },
  ...overrides,
});

describe('Breadcrumb schema validation', () => {
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
    it('validates a trail with no label', () => {
      expectValid(breadcrumb());
    });

    it('validates a label, the click event, disabled and state suffixes', () => {
      expectValid(
        breadcrumb(
          {
            label: 'You are here',
            on: { click: 'navigate' },
            disabled: { when: '$formIsInvalid' },
            'label.compact': 'Path',
          },
          { 'items.compact': [{ label: 'Order', value: 'order' }] },
        ),
      );
    });

    it('validates translation configs as the labels', () => {
      expectValid(
        breadcrumb(
          { label: { key: 'nav.trail' } },
          { items: [{ label: { key: 'nav.orders', default: 'Orders' }, value: 'orders' }] },
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
      ['an item with an href', {}, { items: [{ label: 'Orders', value: 'o', href: '/orders' }] }],
      ['nested items', {}, { items: [{ label: 'Orders', value: 'o', items: [] }] }],
      ['an unknown prop', {}, { separator: '/' }],
    ])('rejects %s', (_name, overrides, props) => {
      expect(validate(without(breadcrumb(overrides, props)))).toBe(false);
    });
  });
});
