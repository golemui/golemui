import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GuiElement } from '../gui-element';

/** A button, with an optional icon. */
export class GuiButton extends GuiElement {
  /** Text of the button. */
  @property({ type: String }) label: string | undefined = undefined;
  /** Disables the button. */
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  /** Icon class name shown next to the text. */
  @property({ type: String }) icon: string | undefined = undefined;
  /** Visual style of the button. */
  @property({ type: String }) variant: 'filled' | 'outlined' | 'link' | undefined = 'filled';
  /** Side of the text the icon is on. */
  @property({ type: String }) iconPosition: 'left' | 'right' | undefined = 'left';
  /** The native button type: `submit` submits the surrounding form. */
  @property({ type: String }) actionType: 'submit' | 'button' | undefined = 'button';
  /** Styles a submit button as blocked by an invalid form. */
  @property({ type: Boolean }) invalid = false;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override render() {
    const icon = this.icon;
    const iconPosition = this.iconPosition || 'left';

    const buttonClasses = {
      'gui-button-with-icon': !!icon,
      [`gui-button-icon-${iconPosition}`]: true,
      'gui-button--outlined': this.variant === 'outlined',
      'gui-button--link': this.variant === 'link',
      'gui-button--invalid': this.invalid && this.actionType === 'submit',
    };

    const iconTemplate = icon
      ? html`<span
          class="gui-widget-icon gui-button-icon ${icon}"
          data-icon=${icon}
          aria-hidden="true"
        ></span>`
      : nothing;

    return html`
      <div class="gui-widget">
        <button
          type=${this.actionType ?? 'button'}
          id=${this.uid}
          class=${classMap(buttonClasses)}
          data-cy=${`${this.uid}_button`}
          ?disabled=${this.disabled}
        >
          ${iconPosition === 'left' ? iconTemplate : nothing}
          ${this.label ? html`<span>${this.label}</span>` : nothing}
          ${iconPosition === 'right' ? iconTemplate : nothing}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-button': GuiButton;
  }
}

safeDefine('gui-button', GuiButton);
