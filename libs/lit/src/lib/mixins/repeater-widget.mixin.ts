import * as Core from '@golemui/core';
import { consume, ContextProvider } from '@lit/context';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { formContext, LitFormContext } from '../context/form.context';
import { repeaterIndexesContext } from '../context/repeater-index-token.context';

export const RepeaterWidgetMixin = <T extends new (...args: any[]) => LitElement>(
  superClass: T,
) => {
  class RepeaterWidgetElementMixin extends superClass {
    @consume({ context: formContext })
    @property({ attribute: false })
    formContext!: LitFormContext<any>;

    @property({ type: Object }) widget!: Core.FormWidget<string>;
    @property({ type: Number }) repeaterIndex = -1;

    @consume({ context: repeaterIndexesContext, subscribe: true })
    @property({ attribute: false })
    parentRepeaterIndexes: number[] = [];

    override connectedCallback() {
      super.connectedCallback();
      this.loadWidgetComponent(this.repeaterIndex);
    }

    public async loadWidgetComponent(repeaterIndex: number) {
      if (!this.widget) return;

      try {
        const component = await this.formContext.widgetRegistry.loadWidget(this.widget.type!);
        const element = new component();

        const repeaterIndexes = [...(this.parentRepeaterIndexes ?? []), repeaterIndex];
        new ContextProvider(element, { context: repeaterIndexesContext, initialValue: repeaterIndexes });

        element.widget = Core.makeRepeaterItemConfig(Core.cloneObject(this.widget), repeaterIndexes);
        element.id = `host-${this.widget.uid}`;
        this.replaceWith(element);
      } catch (err) {
        console.error(`Widget "${this.widget.type}" could not be loaded`, err);
        this.dispatchEvent(
          new CustomEvent<Core.FormHealth>('formHealth', {
            detail: {
              status: 'errored',
              message: `Widget "${this.widget.type}" could not be loaded`,
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

  return RepeaterWidgetElementMixin as unknown as T & (new (...args: any[]) => LitElement);
};
