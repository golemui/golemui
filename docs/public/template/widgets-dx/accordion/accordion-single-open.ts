import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'tab5',
      kind: 'layout',
      type: 'accordion',
      props: {
        singleOpen: true,
        sections: [
          {
            label: 'Personal Information',
            uid: 'section1',
          },
          {
            label: 'Shipping Address',
            uid: 'section2',
          },
          {
            label: 'Billing Address',
            uid: 'section3',
          },
        ],
      },
      children: [
        {
          uid: 'section1',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              kind: 'input',
              type: 'textinput',
              path: 'shoppingCart.firstName',
            },
          ],
        },
        {
          uid: 'section2',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              kind: 'input',
              type: 'textinput',
              path: 'shoppingCart.shippingAddress',
            },
          ],
        },
        {
          uid: 'section3',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              kind: 'input',
              type: 'textinput',
              path: 'shoppingCart.billingAddress',
            },
          ],
        },
      ],
    },
  ],
});
