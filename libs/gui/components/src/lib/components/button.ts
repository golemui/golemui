import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-button')
export class GuiButton extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) variant: 'filled' | 'outlined' | 'link' | undefined = 'filled';
  @property({ type: String }) iconPosition: 'left' | 'right' | undefined = 'left';
  @property({ type: String }) actionType: 'submit' | 'button' | undefined = 'button';
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
          tabindex="0"
          id=${this.uid!}
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

if (typeof customElements !== 'undefined' && !customElements.get('gui-button')) {
  customElements.define('gui-button', GuiButton);
}
