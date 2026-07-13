import type { DxDefinitionItem, DxFormConfig } from '@golemui/gui-shared';
import { gui } from '@golemui/gui-shared';
import { type DxModule } from './modular.dx';

const data = {};

const SUBTOTAL_EXPR =
  '$form.lineItems?.reduce((acc, item) => acc + ((item.quantity ?? 0) * (item.unitPrice ?? 0)), 0) ?? 0';

const formDef: DxDefinitionItem[] = [
  gui.displays.markdownText({ md: '## Invoice' }),

  gui.layouts.grid(
    [
      gui.displays.markdownText({ md: '**From**', size: 6 }),
      gui.displays.markdownText({ md: '**Bill To**', size: 6 }),
      gui.inputs.textInput('company.name', {
        label: 'Company Name',
        size: 6,
        placeholder: 'Acme Inc.',
        validator: { required: true, minLength: 1 },
      }),
      gui.inputs.textInput('client.name', {
        label: 'Invoiced To Name',
        size: 6,
        placeholder: 'Client name',
        validator: { required: true, minLength: 1 },
      }),
      gui.inputs.textInput('company.id', {
        label: 'Company ID',
        size: 6,
        placeholder: 'Tax ID / Reg. no.',
        validator: { required: true, minLength: 1 },
      }),
      gui.inputs.textInput('client.id', {
        label: 'Invoiced To ID',
        size: 6,
        placeholder: 'Tax ID / Reg. no.',
        validator: { required: true, minLength: 1 },
      }),
    ],
    { direction: 'row', autoFit: false, columnGap: 24, rowGap: 8 },
  ),

  gui.displays.markdownText({ md: '#### Invoice details' }),
  gui.layouts.grid(
    [
      gui.inputs.textInput('invoice.number', {
        label: 'Invoice Number',
        size: 3,
        placeholder: 'INV-0001',
        validator: { required: true, minLength: 1 },
      }),
      gui.inputs.datePicker('invoice.date', {
        label: 'Date',
        size: 3,
        validator: { required: true, format: 'date' },
      }),
      gui.inputs.select('invoice.currency', {
        label: 'Invoice Currency',
        size: 3,
        placeholder: 'Select currency',
        options: [
          { value: 'EUR', label: 'EUR' },
          { value: 'USD', label: 'USD' },
        ],
        validator: { type: 'string', required: true },
      }),
      gui.inputs.textInput('invoice.vatNumber', {
        label: 'VAT Number',
        size: 3,
        placeholder: 'EU VAT',
        include: { in: ['eurSelected'] },
      }),
    ],
    { direction: 'row', autoFit: false, columnGap: 16, rowGap: 8 },
  ),

  gui.displays.markdownText({ md: '#### Line Items' }),
  gui.inputs.repeater('lineItems', {
    label: 'Line Items',
    title: 'Line Item',
    addLabel: 'Add line item',
    removeLabel: 'Remove',
    validator: { required: true, minItems: 1 },
    template: [
      gui.layouts.flex(
        [
          gui.inputs.numberInput('lineItems.items.quantity', {
            label: 'Quantity',
            size: 2,
            minimum: 1,
            step: 1,
            // multipleOf 1 restricts the value to integers.
            validator: { required: true, minimum: 1, multipleOf: 1 },
          }),
          gui.inputs.textInput('lineItems.items.description', {
            label: 'Description',
            size: 5,
            validator: { required: true, minLength: 1 },
          }),
          gui.inputs.currency('lineItems.items.unitPrice', {
            label: 'Unit Price',
            size: 3,
            currency: 'USD',
            states: { eurSelected: { currency: 'EUR' } },
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            validator: { required: true },
          }),
          gui.displays.markdownText({
            md: '**Total**  \n{{ (($item.quantity ?? 0) * ($item.unitPrice ?? 0)).toFixed(2) }}',
            size: 2,
            include: { when: '$item.quantity !== undefined' },
          }),
        ],
        { direction: 'row', gap: 12 },
      ),
    ],
  }),

  gui.displays.markdownText({ md: '#### Totals' }),
  gui.layouts.grid(
    [
      gui.displays.markdownText({ md: '**Subtotal (Taxable Base)**', size: 9 }),
      gui.displays.markdownText({ md: `{{(${SUBTOTAL_EXPR}).toFixed(2)}}`, size: 3 }),
      gui.displays.markdownText({
        md: "**Currency Tax ({{$form.invoice?.currency === 'EUR' ? '15%' : '2%'}})**",
        size: 9,
      }),
      gui.displays.markdownText({
        md: `{{((${SUBTOTAL_EXPR}) * ($form.invoice?.currency === 'EUR' ? 0.15 : 0.02)).toFixed(2)}}`,
        size: 3,
      }),
    ],
    { direction: 'row', autoFit: false, columnGap: 12, rowGap: 4 },
  ),

  gui.displays.alert({
    level: 'success',
    text: `Grand Total: {{$form.invoice?.currency === 'EUR' ? '€' : '$'}}{{((${SUBTOTAL_EXPR}) * ($form.invoice?.currency === 'EUR' ? 1.15 : 1.02)).toFixed(2)}}`,
  }),

  gui.layouts.flex(
    [
      gui.actions.button({
        label: 'Submit Invoice',
        actionType: 'submit',
        variant: 'filled',
        disabled: { when: '$formIsInvalid' },
      }),
    ],
    { direction: 'row', align: 'end' },
  ),
];

const formConfig: DxFormConfig = {
  states: { eurSelected: "$form.invoice?.currency === 'EUR'" },
};

export const invoiceDxModular: DxModule = {
  label: 'Invoice',
  data,
  formDef,
  formConfig,
};
