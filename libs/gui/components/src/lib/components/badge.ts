import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';

/** The intents a badge can show: the alert's. */
export type GuiBadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

/**
 * A short label for a status or a count, such as "Paid" or "3 new": its children are the text.
 *
 * ```html
 * <gui-badge variant="success">Paid</gui-badge>
 * ```
 *
 * It has no role: it is part of the text around it, and screen readers read it as such. Its color
 * is not read, so the text has to say what it means: "3 new messages", not "3".
 */
export class GuiBadge extends ReactiveElement {
  /**
   * The intent the badge shows. Without one it is neutral. It reflects, for the stylesheet: set
   * from a framework as a property, it still colors the badge.
   */
  @property({ type: String, reflect: true }) variant: GuiBadgeVariant | undefined = undefined;

  override createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-badge': GuiBadge;
  }
}

safeDefine('gui-badge', GuiBadge);
