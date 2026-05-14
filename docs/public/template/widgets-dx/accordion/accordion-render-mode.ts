import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.accordion(
    [
      {
        label: 'Personal Information',
        uid: 'section1',
        children: [gui.layouts.flex([gui.inputs.textInput('shoppingCart.firstName')])],
      },
      {
        label: 'Shipping Address',
        uid: 'section2',
        children: [gui.layouts.flex([gui.inputs.textInput('shoppingCart.shippingAddress')])],
      },
      {
        label: 'Billing Address',
        uid: 'section3',
        children: [gui.layouts.flex([gui.inputs.textInput('shoppingCart.billingAddress')])],
      },
    ],
    {
      renderMode: 'activeOnly',
      defaultOpen: { section1: true },
      uid: 'accordion_render_mode',
    },
  ),
];
