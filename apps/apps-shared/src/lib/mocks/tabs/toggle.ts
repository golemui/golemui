export const toggle = (): any => ({
  uid: 'tab4',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'control',
      widget: 'toggle',
      label: 'Create new account?',
      path: 'isNewUser',
      props: {},
    },
    {
      uid: '',
      kind: 'control',
      widget: 'toggle',
      label: 'Disabled toggle',
      path: 'isDisabled',
      disabled: true,
      props: {},
    },
    {
      uid: '',
      kind: 'control',
      widget: 'toggle',
      label: 'Create new account?',
      path: 'isNewUserLeft',
      props: {
        togglePosition: 'left',
        hint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium.',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'toggle',
      label: 'Create new account?',
      path: 'isNewUserHint',
      props: {
        hint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium.',
      },
      validator: { type: 'boolean', required: true },
    },
  ],
});
