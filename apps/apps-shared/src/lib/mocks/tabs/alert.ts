export const alert = (uid: string): any => ({
  uid,
  kind: 'layout',
  type: 'grid',
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
