import { GuiShortcutType, GuiShortcut } from '../../core/dx.domain';

// ═══════════════════════════════════════════════════
// GUI Display Types
// ═══════════════════════════════════════════════════

export interface GuiDisplayShortcut extends GuiShortcut {
  type: GuiShortcutType.DISPLAY;
  render: (params: any) => any;
}
