import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import * as Core from '@formforge/core';
import { consume } from '@lit/context';
import { formContext, LitFormContext } from '../context/form.context';

export const FieldMixin = <T extends new (...args: any[]) => LitElement>(superClass: T) => {
  class FieldElement extends superClass {
    @consume({ context: formContext })
    @property({ attribute: false })
    formContext!: LitFormContext<any>;

    @property({ type: Object }) field!: Core.FormField<string>;
    @property({ type: Number }) repeaterIndex = -1;

    override connectedCallback() {
      super.connectedCallback?.();
      this.loadFieldComponent();
    }

    private async loadFieldComponent() {
      if (!this.field) return;

      try {
        const component = await this.formContext.fieldRegistry.loadField(this.field.widget);
        const element = new component();

        (element as any).field =
          this.repeaterIndex > -1
            ? Core.makeRepeaterItemConfig(Core.cloneObject(this.field), this.repeaterIndex)
            : this.field;

        element.id = `host-${this.field.uid}`;

        this.replaceWith(element);
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

    override render() {
      return null;
    }
  }

  return FieldElement as unknown as T & (new (...args: any[]) => LitElement);
};
