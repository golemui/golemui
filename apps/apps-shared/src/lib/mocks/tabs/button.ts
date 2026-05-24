// To be removed: added so apps/apps-shared/src/lib/mocks/kitchen-sink.equivalence.spec.ts test suite passes
export const button = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'flex',
  children: [
    {
      kind: 'action',
      type: 'button',
      label: 'Save',
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Save',
      props: {
        variant: 'outlined',
      },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Save',
      props: {
        variant: 'link',
      },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Save',
      props: {
        icon: 'save',
      },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Save',
      props: {
        icon: 'save',
        iconPosition: 'right',
      },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Save',
      disabled: true,
    },
  ],
});
