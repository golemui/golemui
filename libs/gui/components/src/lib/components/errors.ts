import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { addErrors } from '../utils/templates';
import { GuiElement } from '../gui-element';

/** The error list of a control built by hand. */
export class GuiErrors extends GuiElement {
  /** The error messages. */
  @property({ type: Array }) errors: string[] | undefined = [];
  /** Whether the control was touched: errors wait for it unless unset. */
  @property({ type: Boolean }) touched: boolean | undefined = undefined;
  /** Renders the errors inside a popup panel instead of under a field. */
  @property({ type: Boolean }) panel = false;

  override createRenderRoot() {
    return this;
  }

  override render() {
    super.render();

    return html`${addErrors(
      this.uid,
      {
        touched: this.touched,
        errors: this.errors,
      },
      this.panel ? { variant: 'panel' } : undefined,
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-errors': GuiErrors;
  }
}

safeDefine('gui-errors', GuiErrors);
