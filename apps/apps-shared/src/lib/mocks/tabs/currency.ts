export const currency = (): any => ({
  uid: 'tab13',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currency',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyDisabled',
      disabled: true,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyMaximumFractionDigits',
      props: {
        placeholder: 'maximum 2 digits after the decimal point',
        maximumFractionDigits: 2,
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyMinimumFractionDigits',
      props: {
        placeholder: 'minimum 4 digits after the decimal point',
        minimumFractionDigits: 4,
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyWithIcon',
      props: {
        icon: 'material-icons material-icons-phone_callback',
        hint: 'This is a hint',
        placeholder: 'Please enter price in USD',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'currency',
      path: 'currencyIconRightWithEUR',
      props: {
        currency: 'EUR',
        icon: 'material-icons material-icons-phone_callback',
        iconPosition: 'right',
        hint: 'This is a hint',
        placeholder: 'Please enter price in EUR',
      },
      validator: { type: 'number', required: true, minimum: 100 },
    },
  ],
});
