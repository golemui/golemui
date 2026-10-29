import { gui } from '@golemui/gui-shared';

export const buttonTab = gui.layouts.grid([
  gui.actions.button({ label: 'Save' }),
  gui.actions.button({ label: 'Save', variant: 'outlined' }),
  gui.actions.button({ label: 'Save', variant: 'link' }),
  gui.actions.button({ label: 'Save', icon: 'save' }),
  gui.actions.button({ label: 'Save', icon: 'save', iconPosition: 'right' }),
  gui.actions.button({ label: 'Save', disabled: true }),
  // Icon-only: named for screen readers by ariaLabel.
  gui.actions.button({ icon: 'close', variant: 'outlined', ariaLabel: 'Close' }),
]);
