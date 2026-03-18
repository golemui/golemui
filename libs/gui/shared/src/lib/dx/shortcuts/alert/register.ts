// Complexity: MINIMAL — the simplest shortcut. Start here when learning the pattern.
// See SHORTCUTS.md "Onboarding: Where to Start" for the full progression.
import { defineShortcutType } from '../../core/defineShortcutType';
import type { AlertDecorator, AlertEntry, GslAlertsConfig } from './alert.domain';

export const { gsl: _gslAlerts, gslById: _gslAlertById } = defineShortcutType<
  AlertEntry,
  AlertDecorator,
  GslAlertsConfig
>({
  itemType: 'ALERTS',
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
