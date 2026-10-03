import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GuiElement } from '../gui-element';
import { spinnerIcon } from '../utils/icons';

/**
 * A button, with an optional icon. It renders a native `<button>` in the page, so inside a form
 * `type="submit"` submits it, Enter in a field submits it too, and `name` and `value` are sent
 * with the submission. With `href` it renders a link that looks like a button instead.
 */
export class GuiButton extends GuiElement {
  /** Text of the button. */
  @property({ type: String }) label: string | undefined = undefined;
  /** Disables the button. A disabled link loses its `href`. */
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  /**
   * Shows a spinner and ignores clicks, while keeping the button focusable, for an action in
   * progress.
   */
  @property({ type: Boolean }) loading: boolean | undefined = false;
  /** Icon class name shown next to the text. */
  @property({ type: String }) icon: string | undefined = undefined;
  /** Visual style of the button: `link` looks like a link. */
  @property({ type: String }) variant: 'filled' | 'outlined' | 'link' | undefined = 'filled';
  /** Height of the button. */
  @property({ type: String }) size: 'sm' | 'md' | 'lg' | undefined = 'md';
  /** Side of the text the icon is on. */
  @property({ type: String, attribute: 'icon-position' }) iconPosition:
    | 'left'
    | 'right'
    | undefined = 'left';
  /** The native button type: `submit` submits the form it is in, and `reset` resets it. */
  @property({ type: String }) type: 'button' | 'submit' | 'reset' | undefined = 'button';
  /** Name sent with the form submission when this button submits it. */
  @property({ type: String }) name: string | undefined = undefined;
  /** Value sent under `name` when this button submits the form. */
  @property({ type: String }) value: string | undefined = undefined;
  /** The id of the form the button belongs to, when it is outside it. */
  @property({ type: String }) form: string | undefined = undefined;
  /** Makes the button a link to this URL. */
  @property({ type: String }) href: string | undefined = undefined;
  /** Where the link opens, such as `_blank`. */
  @property({ type: String }) target: string | undefined = undefined;
  /** The link's relationship to the page, such as `noopener`. */
  @property({ type: String }) rel: string | undefined = undefined;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override render() {
    const iconPosition = this.iconPosition || 'left';
    const icon = this.loading
      ? html`<span class="gui-button-icon gui-spinner">${spinnerIcon()}</span>`
      : this.icon
        ? html`<span
            class="gui-widget-icon gui-button-icon ${this.icon}"
            data-icon=${this.icon}
            aria-hidden="true"
          ></span>`
        : nothing;

    const classes = classMap({
      'gui-button-with-icon': !!this.icon || !!this.loading,
      [`gui-button-icon-${iconPosition}`]: true,
      'gui-button--outlined': this.variant === 'outlined',
      'gui-button--link': this.variant === 'link',
      'gui-button--sm': this.size === 'sm',
      'gui-button--lg': this.size === 'lg',
      'gui-button--loading': !!this.loading,
    });

    const content = html`
      ${iconPosition === 'left' ? icon : nothing}
      ${this.label ? html`<span>${this.label}</span>` : nothing}
      ${iconPosition === 'right' ? icon : nothing}
    `;

    if (this.href) {
      // A disabled link has no href, so it needs its role back to stay a link.
      const inactive = !!this.disabled || !!this.loading;
      return html`
        <div class="gui-widget">
          <a
            id=${this.uid}
            class=${classes}
            data-cy=${`${this.uid}_button`}
            href=${this.disabled ? nothing : this.href}
            role=${this.disabled ? 'link' : nothing}
            target=${this.target || nothing}
            rel=${this.rel || nothing}
            aria-disabled=${inactive ? 'true' : nothing}
            aria-busy=${this.loading ? 'true' : nothing}
            @click=${this.onClick}
            >${content}</a
          >
        </div>
      `;
    }

    return html`
      <div class="gui-widget">
        <button
          type=${this.type ?? 'button'}
          id=${this.uid}
          class=${classes}
          data-cy=${`${this.uid}_button`}
          name=${this.name || nothing}
          .value=${this.value ?? ''}
          form=${this.form || nothing}
          ?disabled=${this.disabled}
          aria-disabled=${this.loading ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          @click=${this.onClick}
        >
          ${content}
        </button>
      </div>
    `;
  }

  /** A loading button, or a disabled link, does nothing: no submission, navigation or click. */
  private onClick = (event: Event) => {
    if (!this.loading && !(this.href && this.disabled)) return;
    event.preventDefault();
    event.stopPropagation();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-button': GuiButton;
  }
}

safeDefine('gui-button', GuiButton);
