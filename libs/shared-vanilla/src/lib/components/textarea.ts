import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, ControlTemplateData } from '../utils/templates';
import { TextareaProps } from '../widget.props';
import { styleMap } from 'lit-html/directives/style-map.js';

@customElement('gui-textarea')
export class GuiTextarea extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) placeholder: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String, attribute: 'countermode' }) counterMode:
    | 'remaining'
    | 'current'
    | undefined;
  @property({ type: Number, attribute: 'minimumheight' }) minimumHeight: number | undefined =
    undefined;
  @property({ type: Boolean, attribute: 'autogrow' }) autoGrow: boolean | undefined = false;
  @property({ type: Number, attribute: 'maxlength' }) maxLength: number | undefined = undefined;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`textarea[id="${this.uid}"]`),
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

    const templateData: ControlTemplateData<string> & TextareaProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
      placeholder: this.placeholder,
      icon: this.icon,
      counterMode: this.counterMode ?? 'remaining',
      minimumHeight: this.minimumHeight ?? 120,
      autoGrow: this.autoGrow ?? false,
      maxLength: this.maxLength,
    };

    // Icon
    const fieldClasses: { [key: string]: boolean } = {
      [`gui-textarea--icon`]: false,
    };
    let textareaIcon = html``;

    if (templateData.icon) {
      fieldClasses[`gui-textarea--icon`] = true;

      const classes = {
        'gui-widget-icon': true,
        [templateData.icon]: true,
      };
      textareaIcon = html`<span class=${classMap(classes)}></span>`;
    }

    // Counter
    let counter = html``;

    if (templateData.counterMode && templateData.maxLength) {
      const counterClasses = {
        'gui-textarea--counter': true,
        [`gui-textarea--counter__error`]:
          (templateData.value?.length ?? 0) > templateData.maxLength,
      };
      const counterMode =
        templateData.counterMode === 'current'
          ? html`<span>${templateData.value?.length ?? 0}</span>`
          : html`<span>${templateData.maxLength - (templateData.value?.length ?? 0)}</span>`;

      counter = html`<div class=${classMap(counterClasses)}>
        ${counterMode}
        <span> / ${templateData.maxLength}</span>
      </div>`;
    }

    // AutoGrow
    const autoGrowStyles = {
      height: `${templateData.minimumHeight}px`,
      'min-height': `${templateData.minimumHeight}px`,
    };

    // We can't use @query('textarea') with Angular because it's too lazy
    const textarea = this.querySelector(`textarea[id="${this.uid}"]`) as HTMLTextAreaElement;

    if (this.autoGrow && textarea) {
      const styles = window.getComputedStyle(textarea);
      const pTop = parseFloat(styles.paddingTop);
      const pBottom = parseFloat(styles.paddingBottom);
      const totalVerticalPadding = pTop + pBottom;

      textarea.style.height = 'auto';
      autoGrowStyles.height = `${Math.max(this.minimumHeight ?? 120, textarea.scrollHeight - totalVerticalPadding)}px`;
    }

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-widget">
        <textarea
          id=${this.uid}
          data-cy=${`${this.uid}_textarea`}
          class=${classMap(fieldClasses)}
          style=${styleMap(autoGrowStyles)}
          ?required=${templateData.required}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          placeholder=${templateData.placeholder || nothing}
          @input=${this.valueChanged}
          @blur=${this.onBlur}
        ></textarea>
        ${textareaIcon}
      </div>

      <div class="gui-textarea--validation">
        <div>${addErrors(this.uid as string, templateData)}</div>
        ${counter}
      </div>
    `;
  }

  valueChanged(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: target.value },
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
    'gui-textarea': GuiTextarea;
  }
}
