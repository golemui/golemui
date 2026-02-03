import * as Core from '@golemui/core';
import { consume, ContextProvider, provide } from '@lit/context';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { formContext, LitFormContext } from '../context/form.context';
import {
  RepeaterIndexTokenContext,
  repeaterIndexTokenContext,
} from '../context/repeater-index-token.context';

export const RepeaterFieldMixin = <T extends new (...args: any[]) => LitElement>(superClass: T) => {
  class RepeaterFieldElementMixin extends superClass {
    @consume({ context: formContext })
    @property({ attribute: false })
    formContext!: LitFormContext<any>;

    @property({ type: Object }) field!: Core.FormWidget<string>;
    @property({ type: Number }) repeaterIndex = -1;

    @provide({ context: repeaterIndexTokenContext })
    repeaterIndexToken = new RepeaterIndexTokenContext();

    override connectedCallback() {
      super.connectedCallback();
      this.loadFieldComponent(this.repeaterIndex);
    }

    public async loadFieldComponent(repeaterIndex: number) {
      if (!this.field) return;

      try {
        const component = await this.formContext.widgetRegistry.loadWidget(this.field.type!);
        const element = new component();

        this.repeaterIndexToken.index = repeaterIndex;
        new ContextProvider(element, repeaterIndexTokenContext, this.repeaterIndexToken);

        element.widget = Core.makeRepeaterItemConfig(Core.cloneObject(this.field), repeaterIndex);
        element.id = `host-${this.field.uid}`;
        this.replaceWith(element);
      } catch (err) {
        console.error(`Widget "${this.field.type}" could not be loaded`, err);
        this.dispatchEvent(
          new CustomEvent<Core.FormHealth>('formHealth', {
            detail: {
              status: 'errored',
              message: `Widget "${this.field.type}" could not be loaded`,
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

  return RepeaterFieldElementMixin as unknown as T & (new (...args: any[]) => LitElement);
};
