import { GUIAriaController } from '../controllers/aria.controller';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { addLabel, ControlTemplateData } from '../utils/templates';
import { ToggleProps } from '../widget.props';

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
  @property({ type: String }) togglePosition: 'left' | 'right' | undefined = 'right';

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`span[role="presentation"]`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
      },
    }),
  });

  override createRenderRoot() {
    return this;
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

    if (templateData.togglePosition === 'left') {
      this.classList.add('gui-toggle--left');
    } else if (this.classList.contains('gui-toggle--left')) {
      this.classList.remove('gui-toggle--left');
    }

    return html`
      ${addLabel(this.uid as string, templateData, true)}

      <div class="gui-widget gui-widget--horizontal gui-toggle--switch">
        <input
          type="checkbox"
          id=${this.uid}
          data-cy=${`${this.uid}_toggle`}
          ?checked=${templateData.value}
          ?required=${templateData.required}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          @change=${this.valueChanged}
        />

        <span class="gui-toggle--slider" role="presentation"></span>
      </div>
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
