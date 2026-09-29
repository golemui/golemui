import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { addLabel } from '../utils/templates';
import { GuiElement } from '../gui-element';

export class GuiLabel extends GuiElement {
  @property({ type: Object }) targetElement: HTMLElement[] | HTMLElement | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: Boolean }) required: boolean | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Boolean }) touched: boolean | undefined = undefined;
  @property({ type: Boolean }) native: boolean | undefined = true;

  private ariaController = new GUIAriaController(this, {
    getTargets: () =>
      Array.isArray(this.targetElement)
        ? [...this.targetElement]
        : [this.targetElement as HTMLElement],
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override render() {
    super.render();

    return html`${addLabel(
      this.uid,
      {
        label: this.label,
        hint: this.hint,
        required: this.required,
        errors: this.errors,
        touched: this.touched,
      },
      false,
      undefined,
      this.native,
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-label': GuiLabel;
  }
}

safeDefine('gui-label', GuiLabel);
