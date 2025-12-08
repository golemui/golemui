export const alert = (): any => ({
  uid: 'tab1',
  kind: 'layout',
  widget: 'stack',
  children: [
    {
      uid: '',
      kind: 'display',
      widget: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'warning',
      },
    },
    {
      uid: '',
      kind: 'display',
      widget: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'success',
      },
    },
    {
      uid: '',
      kind: 'display',
      widget: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'error',
      },
    },
    {
      uid: '',
      kind: 'display',
      widget: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'info',
      },
    },
    {
      uid: '',
      kind: 'display',
      widget: 'alert',
      props: {
        text: 'Some fields need your attention',
      },
    },
  ],
});
