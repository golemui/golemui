import * as Core from '@golemui/core';
import { consume } from '@lit/context';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { formContext, LitFormContext } from '../context/form.context';
import { repeaterIndexesContext } from '../context/repeater-index-token.context';

export const WidgetMixin = <T extends new (...args: any[]) => LitElement>(superClass: T) => {
  class WidgetElement extends superClass {
    @consume({ context: formContext })
    @property({ attribute: false })
    formContext!: LitFormContext<any>;

    @property({ type: Object }) widget!: Core.FormWidget<string> | undefined;
    @property({ type: Number }) repeaterIndex: number | undefined;

    @consume({ context: repeaterIndexesContext, subscribe: true })
    @property({ attribute: false })
    repeaterIndexes: number[] = [];

    override connectedCallback() {
      super.connectedCallback?.();
      this.loadWidgetComponent();
    }

    private async loadWidgetComponent() {
      if (!this.widget) return;

      try {
        const component = await this.formContext.widgetRegistry.loadWidget(this.widget.type!);
        const element = new component();

        const repeaterIndexesFromContext = this.repeaterIndexes ?? [];
        let indexes: number[];
        if (this.repeaterIndex !== undefined) {
          indexes = [...repeaterIndexesFromContext, this.repeaterIndex];
        } else {
          indexes = repeaterIndexesFromContext;
        }

        element.widget =
          indexes.length > 0
            ? Core.makeRepeaterItemConfig(
                Core.cloneObject(this.widget as Core.NonFunctionWidget<string>),
                indexes,
              )
            : this.widget;

        element.id = `host-${this.widget.uid}`;

        this.replaceWith(element);
      } catch (err) {
        console.error(`Widget "${this.widget.type}" could not be loaded`, err);

        const code = Core.errorCodes.widgetCouldNotBeLoaded;
        this.dispatchEvent(
          new CustomEvent<Core.FormHealth>('formHealth', {
            detail: {
              status: 'errored',
              message: `[${code}] Widget "${this.widget.type}" could not be loaded`,
              code,
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

  return WidgetElement as unknown as T & (new (...args: any[]) => LitElement);
};
