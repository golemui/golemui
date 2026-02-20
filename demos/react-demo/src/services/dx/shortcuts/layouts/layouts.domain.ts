import { GuiShortcutType, GuiShortcut, ValidGuiShortcut } from '../../core/dx.domain';

// ═══════════════════════════════════════════════════
// Layout Decorator (DX-level type for layouts)
// ═══════════════════════════════════════════════════

export interface LayoutDecorator {
  uid?: string;
  direction?: 'vertical' | 'horizontal';
  widgetName?: string;
}

// ═══════════════════════════════════════════════════
// Layout Sensible Defaults Config
// ═══════════════════════════════════════════════════

export type LayoutSensibleDefaultsConfig = Record<string, never>;

// ═══════════════════════════════════════════════════
// GSL Layout Types
// ═══════════════════════════════════════════════════

export type GslLayoutDecoratorCallback = (current: LayoutDecorator) => Partial<LayoutDecorator>;

export interface GslLayoutByIdConfig {
  decorator?: Partial<LayoutDecorator> | GslLayoutDecoratorCallback;
}

// ═══════════════════════════════════════════════════
// GUI Layout Types
// ═══════════════════════════════════════════════════

export interface GuiLayoutShortcut<T> extends GuiShortcut {
  type: GuiShortcutType.LAYOUT;
  layoutRootProps: {
    widgetName: string;
  };
  layoutNestedProps: T;
  children: ValidGuiShortcut[];
}
