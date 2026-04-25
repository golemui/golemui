import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const nestedRepeaterDemo: FormDemoDefinition = {
  title: '18. Nested Repeaters',
  category: 'Ch3: Compound Widgets',
  description:
    'Nested repeaters with auto-prefixing. All paths are local — '
    + 'the DX pipeline automatically prepends the parent repeater path. '
    + 'This demo uses a 2-level order/line-items structure.',
  formDef: () => [
    gui.inputs.repeater('orders', {
      addLabel: 'Add Order',
      limit: 10,
      template: [
        gui.layouts.horizontalFlex([
          gui.inputs.textInput('orderId'),
          gui.inputs.textInput('customer'),
        ]),
        gui.inputs.repeater('lineItems', {
          addLabel: 'Add Line Item',
          limit: 20,
          template: [
            gui.layouts.horizontalFlex([
              gui.inputs.textInput('productName'),
              gui.inputs.numberInput('quantity'),
              gui.inputs.currency('unitPrice', { currency: 'USD' }),
            ]),
          ],
        }),
      ],
    }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
