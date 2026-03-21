import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiRepeater, _guiInputs, _guiCurrency, _guiHorizontalStack } from '@golemui/gui-shared';

export const nestedRepeaterDemo: FormDemoDefinition = {
  title: '18. Nested Repeaters',
  category: 'Ch3: Compound Widgets',
  description:
    'Nested repeaters with auto-prefixing. All paths are local — '
    + 'the DX pipeline automatically prepends the parent repeater path. '
    + 'This demo uses a 2-level order/line-items structure.',
  formDef: () => [
    _guiRepeater('orders', { addLabel: 'Add Order', limit: 10 }, [
      _guiHorizontalStack([
        _guiInputs({ orderId: 'string', customer: 'string' }),
      ]),
      _guiRepeater('lineItems', { addLabel: 'Add Line Item', limit: 20 }, [
        _guiHorizontalStack([
          _guiInputs({ productName: 'string', quantity: 'number' }),
          _guiCurrency('unitPrice', { currency: 'USD' }),
        ]),
      ]),
    ]),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
