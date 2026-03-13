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
