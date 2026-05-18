import type { InputWidget, WithWidget } from '@golemui/core'
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit'
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';

export type FreedomMatDropdownProps = {
  items?: { value: string; label: string; flag?: string }[];
};

@customElement('freedom-mat-dropdown')
export class FreedomMatDropdownElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, FreedomMatDropdownProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-mat-dropdown');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    const items = (td.items ?? []) as { value: string; label: string; flag?: string }[];
    return html`
      <md-filled-select
        style="width: 100%;"
        .label=${td.label ?? ''}
        .value=${td.value ?? ''}
        ?error=${td.touched && !!td.errors?.length}
        .errorText=${td.errors?.[0] ?? ''}
        @change=${(e: Event) => this.adapter.valueChanged((e.target as HTMLSelectElement).value)}
        @blur=${() => this.adapter.onBlur()}
      >
        ${items.map(
          (item) =>
            html`<md-select-option .value=${item.value}>
              <div slot="headline">
                ${item.flag ? html`<span class="fd-flag">${item.flag}</span>` : null}
                <span>${item.label}</span>
              </div>
            </md-select-option>`,
        )}
      </md-filled-select>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
