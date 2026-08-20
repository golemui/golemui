import { type FormHealth, type FormWidget, errorCodes, formEventNames } from '@golemui/core';
import { consume } from '@lit/context';
import { type LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { formContext, type LitFormContext } from '../context/form.context';

export const WidgetMixin = <T extends new (...args: any[]) => LitElement>(superClass: T) => {
  class WidgetElement extends superClass {
    @consume({ context: formContext })
    @property({ attribute: false })
    formContext!: LitFormContext<any>;

    @property({ type: Object }) widget!: FormWidget<string> | undefined;

    override connectedCallback() {
      super.connectedCallback?.();
      this.loadWidgetComponent();
    }

    private async loadWidgetComponent() {
      if (!this.widget) return;

      try {
        const component = await this.formContext.widgetRegistry.loadWidget(this.widget.type!);
        const element = new component();

        element.widget = this.widget;
        element.id = `host-${this.widget.uid}`;

        this.replaceWith(element);
      } catch (err) {
        console.error(`Widget "${this.widget.type}" could not be loaded`, err);

        const code = errorCodes.widgetCouldNotBeLoaded;
        this.dispatchEvent(
          new CustomEvent<FormHealth>(formEventNames.health, {
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
