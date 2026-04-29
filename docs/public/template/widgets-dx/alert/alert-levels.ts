import { gui } from '@golemui/gui-shared';

export default [
  gui.displays.alert({
    text: 'Operation successful!',
    level: 'success',
    uid: 'alert_levels',
  }),
  gui.displays.alert({
    text: 'Potential issue detected.',
    level: 'warning',
    uid: 'alert_levels_2',
  }),
  gui.displays.alert({
    text: 'Operation failed.',
    level: 'error',
    uid: 'alert_levels_3',
  }),
];
