import { type ExpressionFunctions, type Form } from '@golemui/core';
import { type Example } from './types';

const data = {
  currency: 'USD',
  lineItems: [
    { description: 'Design work', quantity: 4, unitPrice: 95 },
    { description: 'Development', quantity: 10, unitPrice: 120 },
  ],
};

type LineItem = { quantity?: number; unitPrice?: number };

/**
 * Pure functions exposed to the form's reactive expressions as `$fn.name(...)`.
 * They keep the money math out of the expression strings; the form definition
 * only declares WHICH value to show, not HOW to compute it.
 */
const functions: ExpressionFunctions = {
  lineTotal: (item: LineItem | undefined) => {
    return (item?.quantity ?? 0) * (item?.unitPrice ?? 0);
  },
  grandTotal: (items: LineItem[] | undefined) => {
    const lineItems = items ?? [];
    return lineItems.reduce(
      (total, item) => total + (item.quantity ?? 0) * (item.unitPrice ?? 0),
      0,
    );
  },
  hasItems: (items: unknown[] | undefined) => {
    return (items?.length ?? 0) > 0;
  },
  formatMoney: (amount: number, currency: string | undefined) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency ?? 'USD',
    }).format(amount);
  },
};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const demoFunctions: Example = {
  data,
  form: async () => {
    const baseUrl = new URL('/assets/mocks/demo-functions.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
  functions,
};
