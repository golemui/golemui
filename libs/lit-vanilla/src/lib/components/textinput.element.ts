import * as Core from '@formforge/core';
import * as Lit from '@formforge/lit';
import { consume, provide } from '@lit/context';
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { TextinputProps } from '@formforge/shared-vanilla';
import { Subscription } from 'rxjs';

@customElement('ff-textinput')
export class TextinputElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlAdapter<string, TextinputProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-textinput');
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
      ? html`<div class="ff-textinput__hint" id=${`${this.field.uid}_hint`}>
          ${this.adapter.templateData.hint}
        </div>`
      : html``;

    // Icon
    const textinputIcon: { [key: string]: boolean } = {
      'ff-textinput--icon': false,
      'ff-textinput--icon-right': false,
    };
    let icon;
    if (this.adapter.templateData.icon) {
      textinputIcon['ff-textinput--icon'] = true;
      textinputIcon['ff-textinput--icon-right'] =
        this.adapter.templateData.iconPosition === 'right';

      const classes = {
        'ff-textinput__icon': true,
        'ff-textinput__icon--right': this.adapter.templateData.iconPosition === 'right',
        [this.adapter.templateData.icon]: true,
      };
      icon = html`<span class=${classMap(classes)}></span>`;
    } else {
      icon = html``;
    }

    return html`
      <label for=${this.field.uid}>
        ${this.adapter.templateData.label + (this.adapter.templateData.required ? ' *' : '')}
        ${hint}
      </label>

      <div class="field">
        <input
          type="text"
          id=${this.field.uid}
          class=${classMap(textinputIcon)}
          value=${this.adapter.templateData.value ?? ''}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          placeholder=${this.adapter.templateData.placeholder || nothing}
          @input="${() => this.valueChanged(event)}"
          aria-required=${this.adapter.templateData.required || nothing}
          aria-describedby=${this.adapter.templateData.hint ? `${this.field.uid}_hint` : nothing}
        />
        ${icon}
      </div>
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
