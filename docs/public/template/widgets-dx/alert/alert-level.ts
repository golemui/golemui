import { gui } from '@golemui/gui-shared';

export default [
  gui.displays.alert({
    text: 'Default level',
    level: 'default',
  }),
  gui.displays.alert({
    text: 'Info level',
    level: 'info',
  }),
  gui.displays.alert({
    text: 'Success level',
    level: 'success',
  }),
  gui.displays.alert({
    text: 'Warning level',
    level: 'warning',
  }),
  gui.displays.alert({
    text: 'Error level',
    level: 'error',
  }),
];
