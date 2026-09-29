import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { addErrors } from '../utils/templates';
import { GuiElement } from '../gui-element';

export class GuiErrors extends GuiElement {
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = undefined;
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
