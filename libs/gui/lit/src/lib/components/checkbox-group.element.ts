import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { CheckboxGroupProps, OptionValue } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/checkbox-group';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import { live } from 'lit/directives/live.js';

export class CheckboxGroupElement extends LitElement implements WithWidget {
  widget!: InputWidget<OptionValue[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<OptionValue[], CheckboxGroupProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-checkbox-group', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-checkbox-group
        .uid=${this.widget.uid}
        .idPrefix=${this.adapter.formName}
        .label=${this.adapter.templateData.label}
        .errors=${this.adapter.templateData.errors}
        .touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .values=${live(this.adapter.templateData.value)}
        .hint=${this.adapter.templateData.hint}
        .options=${this.adapter.templateData.options}
        .labelField=${this.adapter.templateData.labelField}
        .valueField=${this.adapter.templateData.valueField}
        .direction=${this.adapter.templateData.direction}
        @gui-input=${this.valueChanged}
        @gui-blur=${() => this.adapter.onBlur()}
      ></gui-checkbox-group>
    `;
  }

  valueChanged(event: CustomEvent) {
    const value = event.detail.value;
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-checkbox-group-input', CheckboxGroupElement);
