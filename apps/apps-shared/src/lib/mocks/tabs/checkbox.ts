export const checkbox = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'grid',
  children: [
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Create new account?',
      path: 'isNewUser',
      props: {},
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Disabled checkbox',
      path: 'isDisabled',
      disabled: true,
      readonly: true,
      props: {},
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Create new account?',
      path: 'isNewUserLeft',
      props: {
        checkboxPosition: 'left',
        hint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium.',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Create new account?',
      path: 'isNewUserHint',
      props: {
        hint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium.',
      },
      validator: { type: 'boolean', required: true },
    },
  ],
});
