// Complexity: MINIMAL — the simplest shortcut. Start here when learning the pattern.
// See SHORTCUTS.md "Onboarding: Where to Start" for the full progression.
import { createShortcutType } from '@golemui/dx';
import type { AlertDecorator, AlertEntry, GslAlertsConfig } from './alert.domain';

export const alertShortcutType = createShortcutType<AlertEntry, AlertDecorator, GslAlertsConfig>({
  itemType: 'ALERTS',
  kind: 'display',
  entryShape: 'bare',
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'display',
    type: 'alert',
    props: {
      text: def.text,
      ...(def.level != null ? { level: def.level } : {}),
    },
  }),
});

export const _gslAlerts = alertShortcutType.gsl;
export const _gslAlertByUid = alertShortcutType.gslByUid;
