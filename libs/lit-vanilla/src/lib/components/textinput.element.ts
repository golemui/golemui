import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { TextinputProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';

@customElement('gui-textinput')
export class TextinputElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, TextinputProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-textinput');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    // Hint
    const hint = this.adapter.templateData.hint
      ? html`<div class="gui-textinput__hint" id=${`${this.field.uid}_hint`}>
          ${this.adapter.templateData.hint}
        </div>`
      : html``;

    // Icon
    const textinputIcon: { [key: string]: boolean } = {
      'gui-textinput--icon': false,
      'gui-textinput--icon-right': false,
    };
    let icon;
    if (this.adapter.templateData.icon) {
      textinputIcon['gui-textinput--icon'] = true;
      textinputIcon['gui-textinput--icon-right'] =
        this.adapter.templateData.iconPosition === 'right';

      const classes = {
        'gui-textinput__icon': true,
        'gui-textinput__icon--right': this.adapter.templateData.iconPosition === 'right',
        [this.adapter.templateData.icon]: true,
      };
      icon = html`<span class=${classMap(classes)}></span>`;
    } else {
      icon = html``;
    }

    const showErrors =
      this.adapter.templateData.touched &&
      this.adapter.templateData.errors &&
      this.adapter.templateData.errors.length > 0;

    return html`
      <label for=${this.field.uid}>
        ${this.adapter.templateData.label +
        (this.adapter.templateData.validator?.required ? ' *' : '')}
        ${hint}
      </label>

      <div class="gui-field">
        <input
          type="text"
          id=${this.field.uid}
          class=${classMap(textinputIcon)}
          value=${this.adapter.templateData.value ?? ''}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          placeholder=${this.adapter.templateData.placeholder || nothing}
          @input="${() => this.valueChanged(event)}"
          @blur="${() => this.adapter.onBlur()}"
          aria-invalid=${showErrors || nothing}
          aria-required=${this.adapter.templateData.validator?.required || nothing}
          aria-describedby=${this.adapter.templateData.hint ? `${this.field.uid}_hint` : nothing}
        />
        ${icon}
      </div>

      ${showErrors
        ? html`<ul class="gui-validator">
            ${this.adapter.templateData.errors?.map(
              (error: any) => html`<li class="gui-validator__error">${error}</li>`,
            )}
          </ul>`
        : ''}
    `;
  }

  valueChanged(event: Event | undefined) {
    const target = event?.target as HTMLInputElement;
    this.adapter.valueChanged(target.value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
