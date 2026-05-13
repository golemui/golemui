import type { AlertProps } from '../../../widget.props';
import type { DxCommonFields } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Alert Decorator
// ═══════════════════════════════════════════════════

export interface AlertDecorator extends DxCommonFields, Partial<AlertProps> {
  text: string; // required — AlertProps.text is required
}

// ═══════════════════════════════════════════════════
// GSL Alert Types
// ═══════════════════════════════════════════════════

export type GslAlertsConfig = GslConfigBase<AlertDecorator>;

// ═══════════════════════════════════════════════════
// GUI Alert Types
// ═══════════════════════════════════════════════════

export type AlertEntry = DefOrCallback<AlertDecorator>;

export type GuiAlertShortcut = GuiShortcutOf<'ALERTS', AlertEntry>;
