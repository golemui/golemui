import { GUIAriaController } from '../controllers/aria.controller';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { addErrors, ControlTemplateData } from '../utils/templates';
import { ToggleProps } from '@golemui/gui-shared';

@customElement('gui-toggle')
export class GuiToggle extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: boolean | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) togglePosition: 'left' | 'right' | undefined = 'left';

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`span[role="presentation"]`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        touched: this.touched,
        // Checkboxes can't have aria-readonly
        readonly: false,
        disabled: false,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<boolean> & ToggleProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      togglePosition: this.togglePosition,
    };

    if (templateData.togglePosition === 'right') {
      this.classList.add('gui-toggle--right');
    } else if (this.classList.contains('gui-toggle--right')) {
      this.classList.remove('gui-toggle--right');
    }

    return html`
      <label
        class="gui-label"
        for=${this.uid}
        data-cy=${`${this.uid}_label`}
        id=${`${this.uid}_label`}
      >
        <div class="gui-widget gui-widget--horizontal gui-toggle--switch">
          <input
            type="checkbox"
            id=${this.uid}
            data-cy=${`${this.uid}_toggle`}
            ?checked=${templateData.value}
            ?required=${templateData.required}
            ?disabled=${templateData.disabled || templateData.readonly}
            @change=${this.valueChanged}
            @blur=${this.onBlur}
          />

          <span class="gui-toggle--slider" role="presentation"></span>
        </div>

        <span class="gui-label__container">
          ${templateData.label + (templateData.required ? ' *' : '')}
        </span>
      </label>

      <div class="gui-widget-hint" id=${`${templateData.uid}_hint`}>${templateData.hint ?? nothing} ${addErrors(this.uid as string, templateData)}</div>
    `;
  }

  valueChanged(event: Event | undefined) {
    event?.stopPropagation();

    if (!this.readOnly) {
      const target = event?.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: target.checked },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  onBlur() {
    this.dispatchEvent(
      new CustomEvent('blur', {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-toggle': GuiToggle;
  }
}
