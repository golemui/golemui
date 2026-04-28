import { gui } from '@golemui/gui-shared';

const longHint =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium.';

export const toggleTab = gui.layouts.flex([
  gui.inputs.booleanInput('isNewUser', { label: 'Create new account?' }),
  gui.inputs.booleanInput('isDisabled', {
    label: 'Disabled toggle',
    disabled: true,
    readonly: true,
  }),
  gui.inputs.booleanInput('isNewUserLeft', {
    label: 'Create new account?',
    togglePosition: 'left',
    hint: longHint,
  }),
  gui.inputs.booleanInput('isNewUserHint', {
    label: 'Create new account?',
    hint: longHint,
    validator: { required: true },
  }),
]);
