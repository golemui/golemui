export const accordion = (): any => ({
  uid: 'tab5',
  kind: 'layout',
  type: 'accordion',
  props: {
    singleOpen: false,
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
      type: 'flex',
      children: [
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'shoppingCart.firstName',
          validator: { type: 'string', required: true },
        },
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'shoppingCart.lastName',
          validator: { type: 'string', required: true },
        },
      ],
    },
    {
      uid: 'section2',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'shoppingCart.shippingAddress',
          validator: { type: 'string', required: true },
        },
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'shoppingCart.shippingState',
          validator: { type: 'string', required: true },
        },
      ],
    },
    {
      uid: 'section3',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'shoppingCart.billingAddress',
          validator: { type: 'string', required: true },
        },
        {
          uid: '',
          kind: 'input',
          type: 'textinput',
          path: 'shoppingCart.billingState',
          validator: { type: 'string', required: true },
        },
      ],
    },
  ],
});
