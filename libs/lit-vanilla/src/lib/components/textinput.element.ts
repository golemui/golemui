import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { TextinputProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addIcon, addLabel } from '../utils/templates';

@customElement('gui-textinput')
export class TextinputElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, TextinputProps>();

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
    this.classList.add('gui-textinput');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    // Icon
    const textinputIcon = addIcon('textinput', this.adapter.templateData);

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData)}

      <div class="gui-field">
        <input
          type="text"
          id=${this.field.uid}
          data-cy=${`${this.field.uid}_textinput`}
          class=${classMap(textinputIcon.fieldClasses)}
          required=${this.adapter.templateData.validator?.required ? '' : nothing}
          value=${this.adapter.templateData.value ?? ''}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          placeholder=${this.adapter.templateData.placeholder || nothing}
          @input="${() => this.valueChanged(event)}"
          @blur="${() => this.adapter.onBlur()}"
        />
        ${textinputIcon.html}
      </div>

      ${addErrors(this.field.uid, this.adapter.templateData)}
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
