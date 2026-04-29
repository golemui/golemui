import { gui } from '@golemui/gui-shared';

export const alertTab = gui.layouts.flex([
  gui.displays.alert({ text: 'Some fields need your attention', level: 'warning' }),
  gui.displays.alert({ text: 'Some fields need your attention', level: 'success' }),
  gui.displays.alert({ text: 'Some fields need your attention', level: 'error' }),
  gui.displays.alert({ text: 'Some fields need your attention', level: 'info' }),
  gui.displays.alert({ text: 'Some fields need your attention' }),
]);
