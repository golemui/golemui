import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GuiElement } from '../gui-element';
import { warnInDevelopment } from '../utils/dev';
import { spinnerIcon } from '../utils/icons';

/**
 * A button, with an optional icon. It renders a native `<button>` in the page, so inside a form
 * `type="submit"` submits it, Enter in a field submits it too, and `name` and `value` are sent
 * with the submission. With `href` it renders a link that looks like a button instead.
 *
 * With `commandfor` and `command` it opens and closes a popover, a menu or a dialog, as a native
 * invoker does:
 *
 * ```html
 * <gui-button label="Edit" commandfor="edit" command="show-modal"></gui-button>
 * ```
 *
 * The `aria-describedby` and `aria-haspopup` set on the element, such as the description a
 * `gui-tooltip` adds, go on to its inner button or link, where assistive technology reads them.
 */
export class GuiButton extends GuiElement {
  /** Text of the button. */
  @property({ type: String }) label: string | undefined = undefined;
  /**
   * The button's accessible name when it shows no label, such as an icon-only button. Screen
   * readers announce it; with a label, the label is the name and this is ignored.
   */
  @property({ type: String, attribute: 'button-aria-label' }) buttonAriaLabel: string | undefined =
    undefined;
  /** Disables the button. A disabled link loses its `href`. */
  @property({ converter: booleanAttribute }) disabled: boolean | undefined = false;
  /**
   * Shows a spinner and ignores clicks, while keeping the button focusable, for an action in
   * progress.
   */
  @property({ converter: booleanAttribute }) loading: boolean | undefined = false;
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
  /**
   * The id of the popover, menu or dialog the button acts on with `command`: the native
   * `commandfor`. A link ignores it. It reflects, so `gui-popover` and `gui-menu` find the button.
   */
  @property({ type: String, attribute: 'commandfor', reflect: true }) commandFor:
    | string
    | undefined = undefined;
  /**
   * What the button does to the element `commandfor` names: `toggle-popover`, `show-popover`,
   * `hide-popover`, `show-modal`, `close`, `request-close`, or a custom `--command`.
   */
  @property({ type: String }) command: string | undefined = undefined;
  /** The element's `aria-describedby`, for its inner button or link. @internal */
  @property({ type: String, attribute: 'aria-describedby' }) describedBy: string | undefined =
    undefined;
  /** The element's `aria-haspopup`, for its inner button or link. @internal */
  @property({ type: String, attribute: 'aria-haspopup' }) hasPopup: string | undefined = undefined;
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

    // A visible label is always the name (WCAG 2.5.3): the aria-label is only for no label.
    const ariaLabel = !this.label && this.buttonAriaLabel ? this.buttonAriaLabel : nothing;

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
            aria-label=${ariaLabel}
            aria-describedby=${this.describedBy || nothing}
            aria-haspopup=${this.hasPopup || nothing}
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
          commandfor=${this.commandFor || nothing}
          command=${this.command || nothing}
          aria-label=${ariaLabel}
          aria-describedby=${this.describedBy || nothing}
          aria-haspopup=${this.hasPopup || nothing}
          aria-disabled=${this.loading ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          @click=${this.onClick}
        >
          ${content}
        </button>
      </div>
    `;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.label && !this.buttonAriaLabel) {
      warnInDevelopment(
        this,
        'has no label or button-aria-label, so it has no accessible name. Set one of them.',
      );
    }
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
