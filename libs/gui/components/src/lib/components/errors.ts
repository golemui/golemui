import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { addErrors } from '../utils/templates';

export class GuiErrors extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;

  override createRenderRoot() {
    return this;
  }

  override render() {
    super.render();

    return html`${addErrors(this.uid as string, {
      touched: this.touched,
      errors: this.errors,
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-errors': GuiErrors;
  }
}

safeDefine('gui-errors', GuiErrors);
