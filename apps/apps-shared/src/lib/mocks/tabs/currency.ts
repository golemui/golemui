export const currency = (): any => ({
  uid: 'tab13',
  kind: 'layout',
  type: 'grid',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'currency',
      path: 'currency',
    },
    {
      uid: '',
      kind: 'input',
      type: 'currency',
      path: 'currencyDisabled',
      disabled: true,
      readonly: true,
    },
    {
      uid: '',
      kind: 'input',
      type: 'currency',
      path: 'currencyMaximumFractionDigits',
      props: {
        placeholder: 'maximum 2 digits after the decimal point',
        maximumFractionDigits: 2,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'currency',
      path: 'currencyMinimumFractionDigits',
      props: {
        placeholder: 'minimum 4 digits after the decimal point',
        minimumFractionDigits: 4,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'currency',
      path: 'currencyWithIcon',
      props: {
        icon: 'phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter price in USD',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'currency',
      path: 'currencyIconRightWithEUR',
      props: {
        currency: 'EUR',
        icon: 'phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter price in EUR',
      },
      validator: { type: 'number', required: true, minimum: 100 },
    },
  ],
});
