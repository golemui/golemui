import { LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as Core from '@formforge/core';
import { html, unsafeStatic } from 'lit/static-html.js';

@customElement('ff-field')
export class FieldElement extends LitElement {
  @property({ type: Object }) formContext!: Core.FormContext<Core.WithField>;
  @property({ type: Object }) field!: Core.FormField<string>;
  @property({ type: Number }) repeaterIndex = -1;

  @state() private loadedTag: string | null = null;

  override firstUpdated(changedProps: Map<string, unknown>) {
    super.firstUpdated(changedProps);

    this.loadFieldComponent();
  }

  async loadFieldComponent() {
    try {
      const componentTag = await this.loadFromRegistry(this.field.widget);
      this.loadedTag = `ff-${componentTag}`;
    } catch (err) {
      console.error(`Field "${this.field.widget}" could not be loaded`, err);
      this.dispatchEvent(
        new CustomEvent('formError', {
          detail: {
            kind: 'fatal',
            error: `Field "${this.field.widget}" could not be loaded`,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  /**
   * Simula el registro dinámico de Angular (fieldRegistry.loadField)
   * Devuelve el nombre del custom element a usar, p.ej. 'ff-text-input'
   */
  async loadFromRegistry(widgetName: string): Promise<string> {
    const registry = await this.formContext.fieldRegistry.loadField(
      this.field.widget,
    );
    if (!registry)
      throw new Error(`Widget ${widgetName} not found in registry`);
    if (!customElements.get(`ff-${this.field.widget}`)) {
      customElements.define(
        `ff-${this.field.widget}`,
        registry as unknown as CustomElementConstructor,
      );
    }
    return this.field.widget;
  }

  override render() {
    super.render();

    if (!this.loadedTag) {
      return html`<p>Loading field...</p>`;
    }

    const tag = unsafeStatic(this.loadedTag);
    const field =
      this.repeaterIndex > -1
        ? Core.makeRepeaterItemConfig(
            Core.cloneObject(this.field),
            this.repeaterIndex,
          )
        : this.field;

    return html`<${tag} .field=${field}></${tag}>`;
  }
}
