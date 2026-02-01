export const accordion = (): any => ({
  uid: 'tab5',
  kind: 'layout',
  widget: 'accordion',
  props: {
    singleOpen: false,
    logic: 'hide',
    defaultOpen: {
      section1: true,
    },
    sections: [
      { label: 'Personal Information', uid: 'section1' },
      { label: 'Shipping Address', uid: 'section2' },
      { label: 'Billing Address', uid: 'section3' },
    ],
  },
  on: { change: 'onAccordionEvent' },
  children: [
    {
      uid: 'section1',
      kind: 'layout',
      widget: 'stack',
      children: [
        {
          uid: '',
          kind: 'control',
          widget: 'textinput',
          path: 'shoppingCart.firstName',
          validator: { type: 'string', required: true },
        },
        {
          uid: '',
          kind: 'control',
          widget: 'textinput',
          path: 'shoppingCart.lastName',
          validator: { type: 'string', required: true },
        },
      ],
    },
    {
      uid: 'section2',
      kind: 'layout',
      widget: 'stack',
      children: [
        {
          uid: '',
          kind: 'control',
          widget: 'textinput',
          path: 'shoppingCart.shippingAddress',
          validator: { type: 'string', required: true },
        },
        {
          uid: '',
          kind: 'control',
          widget: 'textinput',
          path: 'shoppingCart.shippingState',
          validator: { type: 'string', required: true },
        },
      ],
    },
    {
      uid: 'section3',
      kind: 'layout',
      widget: 'stack',
      children: [
        {
          uid: '',
          kind: 'control',
          widget: 'textinput',
          path: 'shoppingCart.billingAddress',
          validator: { type: 'string', required: true },
        },
        {
          uid: '',
          kind: 'control',
          widget: 'textinput',
          path: 'shoppingCart.billingState',
          validator: { type: 'string', required: true },
        },
      ],
    },
  ],
});
