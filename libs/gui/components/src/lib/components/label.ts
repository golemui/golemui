import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { addLabel } from '../utils/templates';
import { GuiElement } from '../gui-element';

/** A label for a control built by hand. It sets the control's ARIA attributes from its state. */
export class GuiLabel extends GuiElement {
  /** The control or controls the label describes; they receive its ARIA attributes. */
  @property({ type: Object, attribute: false }) targetElement:
    | HTMLElement[]
    | HTMLElement
    | undefined = undefined;
  /** Text of the label. */
  @property({ type: String }) label: string | undefined = undefined;
  /** Help text shown under the label. */
  @property({ type: String }) hint: string | undefined = undefined;
  /** Adds the required marker, and `aria-required` to the target. */
  @property({ converter: booleanAttribute }) required: boolean | undefined = undefined;
  /** Errors of the labelled control, which set `aria-invalid` on it. */
  @property({ type: Array }) errors: string[] | undefined = [];
  /** Sets `aria-disabled` on the target. */
  @property({ converter: booleanAttribute }) disabled: boolean | undefined = false;
  /** Sets `aria-readonly` on the target. */
  @property({ attribute: 'readonly', converter: booleanAttribute }) readOnly: boolean | undefined =
    false;
  /** Whether the labelled control was touched: errors wait for it unless unset. */
  @property({ converter: booleanAttribute }) touched: boolean | undefined = undefined;
  /** Renders a native `<label for>`. Turn it off for targets that a `<label>` cannot name. */
  @property({ converter: booleanAttribute }) native: boolean | undefined = true;

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
      this.native !== false,
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-label': GuiLabel;
  }
}

safeDefine('gui-label', GuiLabel);
