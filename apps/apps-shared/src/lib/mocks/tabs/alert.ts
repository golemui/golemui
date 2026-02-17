export const alert = (): any => ({
  uid: 'tab1',
  kind: 'layout',
  type: 'flex',
  children: [
    {
      uid: '',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'warning',
      },
    },
    {
      uid: '',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'success',
      },
    },
    {
      uid: '',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'error',
      },
    },
    {
      uid: '',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'info',
      },
    },
    {
      uid: '',
      kind: 'display',
      type: 'alert',
      props: {
        text: 'Some fields need your attention',
      },
    },
  ],
});
