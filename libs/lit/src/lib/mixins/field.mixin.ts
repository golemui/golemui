import * as Core from '@golemui/core';
import { consume } from '@lit/context';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { formContext, LitFormContext } from '../context/form.context';
import {
  RepeaterIndexTokenContext,
  repeaterIndexTokenContext,
} from '../context/repeater-index-token.context';

export const FieldMixin = <T extends new (...args: any[]) => LitElement>(superClass: T) => {
  class FieldElement extends superClass {
    @consume({ context: formContext })
    @property({ attribute: false })
    formContext!: LitFormContext<any>;

    @property({ type: Object }) field!: Core.FormField<string> | undefined;
    @property({ type: Number }) repeaterIndex: number | undefined;

    @consume({ context: repeaterIndexTokenContext, subscribe: true })
    @property({ attribute: false })
    repeaterIndexToken?: RepeaterIndexTokenContext;

    override connectedCallback() {
      super.connectedCallback?.();
      this.loadFieldComponent();
    }

    private async loadFieldComponent() {
      if (!this.field) return;

      try {
        const component = await this.formContext.fieldRegistry.loadField(this.field.widget);
        const element = new component();

        const index = this.repeaterIndex ?? this.repeaterIndexToken?.index;
        element.field =
          typeof index === 'number' && !Number.isNaN(index) && index > -1
            ? Core.makeRepeaterItemConfig(Core.cloneObject(this.field), index)
            : this.field;

        element.id = `host-${this.field.uid}`;

        this.replaceWith(element);
      } catch (err) {
        console.error(`Field "${this.field.widget}" could not be loaded`, err);
        this.dispatchEvent(
          new CustomEvent<Core.FormHealth>('formHealth', {
            detail: {
              status: 'errored',
              message: `Field "${this.field.widget}" could not be loaded`,
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
