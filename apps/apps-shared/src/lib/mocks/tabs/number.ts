export const number = (): any => ({
  uid: 'tab8',
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'number',
      label: 'Temperature',
      props: {
        hint: 'This is a hint',
        placeholder: 'ºC',
        minimum: -45,
        maximum: 42,
        step: 0.5,
        autoGrow: true,
      },
      validator: { type: 'number', minimum: -45, maximum: 42, required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'numberDisabled',
      disabled: true,
      readonly: true,
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'percentage',
      props: {
        placeholder: '%',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'percentageWithHint',
      label: 'Percentage',
      props: {
        hint: 'This is a hint',
        placeholder: '%',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'numberIcon',
      props: {
        hint: 'This is a hint',
        placeholder: 'ms',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'numberIconRight',
      props: {
        hint: 'This is a hint',
        placeholder: 'Inch',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'height',
      label: 'Height',
      props: {
        hint: 'In meters',
        step: 0.01,
      },
      validator: { type: 'number', minimum: 0, maximum: 2.5, required: true },
    },
  ],
});
