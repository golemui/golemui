import * as Core from '@golemui/core';
import { consume } from '@lit/context';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { formContext, LitFormContext } from '../context/form.context';
import {
  RepeaterIndexTokenContext,
  repeaterIndexTokenContext,
} from '../context/repeater-index-token.context';

export const WidgetMixin = <T extends new (...args: any[]) => LitElement>(superClass: T) => {
  class WidgetElement extends superClass {
    @consume({ context: formContext })
    @property({ attribute: false })
    formContext!: LitFormContext<any>;

    @property({ type: Object }) widget!: Core.FormWidget<string> | undefined;
    @property({ type: Number }) repeaterIndex: number | undefined;

    @consume({ context: repeaterIndexTokenContext, subscribe: true })
    @property({ attribute: false })
    repeaterIndexToken?: RepeaterIndexTokenContext;

    override connectedCallback() {
      super.connectedCallback?.();
      this.loadWidgetComponent();
    }

    private async loadWidgetComponent() {
      if (!this.widget) return;

      try {
        const component = await this.formContext.widgetRegistry.loadWidget(this.widget.type!);
        const element = new component();

        const index = this.repeaterIndex ?? this.repeaterIndexToken?.index;
        element.widget =
          typeof index === 'number' && !Number.isNaN(index) && index > -1
            ? Core.makeRepeaterItemConfig(Core.cloneObject(this.widget), index)
            : this.widget;

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

  return WidgetElement as unknown as T & (new (...args: any[]) => LitElement);
};
