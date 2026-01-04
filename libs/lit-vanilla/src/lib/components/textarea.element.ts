import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { TextareaProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel } from '../utils/templates';

@customElement('gui-textarea')
export class TextareaElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, TextareaProps>();

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.field.uid}"]`),
    getState: () => ({
      uid: this.field.uid,
      templateData: this.adapter.templateData,
    }),
  });

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-textarea');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    // Icon
    const fieldClasses: { [key: string]: boolean } = {
      [`gui-textarea--icon`]: false,
    };
    let textareaIcon = html``;

    if (this.adapter.templateData.icon) {
      fieldClasses[`gui-textarea--icon`] = true;

      const classes = {
        'gui-field-icon': true,
        'gui-field-icon--right': true,
        [this.adapter.templateData.icon]: true,
      };
      textareaIcon = html`<span class=${classMap(classes)}></span>`;
    }

    // Counter
    let counter = html``;

    if (this.adapter.templateData.counterMode && this.adapter.templateData.validator?.maxLength) {
      const counterClasses = {
        'gui-textarea--counter': true,
        [`gui-textarea--counter__error`]:
          (this.adapter.templateData.value?.length ?? 0) >
          this.adapter.templateData.validator?.maxLength,
      };
      const counterMode =
        this.adapter.templateData.counterMode === 'current'
          ? html`<span>${this.adapter.templateData.value?.length ?? 0}</span>`
          : html`<span
              >${this.adapter.templateData.validator.maxLength -
              (this.adapter.templateData.value?.length ?? 0)}</span
            >`;

      counter = html`<div class=${classMap(counterClasses)}>
        ${counterMode}
        <span> / ${this.adapter.templateData.validator.maxLength}</span>
      </div>`;
    }

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData)}

      <div class="gui-field">
        <textarea
          type="text"
          id=${this.field.uid}
          data-cy=${`${this.field.uid}_textarea`}
          class=${classMap(fieldClasses)}
          style=${{
            height: `${this.adapter.templateData.minimumHeight ?? 120}px`,
            'min-height': `${this.adapter.templateData.minimumHeight ?? 120}px`,
          }}
          required=${this.adapter.templateData.validator?.required ? '' : nothing}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          placeholder=${this.adapter.templateData.placeholder || nothing}
          @input="${() => this.valueChanged(event)}"
          @blur="${() => this.adapter.onBlur()}"
        ></textarea>
        ${textareaIcon}
      </div>

      <div class="gui-textarea--validation">
        <div>${addErrors(this.field.uid, this.adapter.templateData)}</div>
        ${counter}
      </div>
    `;
  }

  valueChanged(event: Event | undefined) {
    const target = event?.target as HTMLInputElement;

    if (this.adapter.templateData.autoGrow) {
      target.style.height = 'auto';
      target.style.height = `${Math.max(this.adapter.templateData.minimumHeight ?? 120, target.scrollHeight)}px`;
    }

    this.adapter.valueChanged(target.value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
