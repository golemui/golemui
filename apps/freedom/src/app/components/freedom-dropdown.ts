import type * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

export type FreedomDropdownProps = {
  items?: { value: string; label: string; flag?: string }[];
};

@customElement('freedom-dropdown')
export class FreedomDropdownElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<string, FreedomDropdownProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-dropdown');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    const items = (td.items ?? []) as { value: string; label: string; flag?: string }[];
    const hasError = td.touched && !!td.errors?.length;
    const selected = items.find((i) => i.value === td.value);
    return html`
      <label class="freedom-dropdown__label">${td.label ?? ''}</label>
      <div class="freedom-dropdown__wrap">
        <select
          class="freedom-dropdown__field ${hasError ? 'freedom-dropdown__field--error' : ''}"
          .value=${td.value ?? ''}
          @change=${(e: Event) => this.adapter.valueChanged((e.target as HTMLSelectElement).value)}
          @blur=${() => this.adapter.onBlur()}
        >
          <option value="" disabled ?selected=${!selected}>Pick one…</option>
          ${items.map(
            (item) =>
              html`<option .value=${item.value} ?selected=${td.value === item.value}>
                ${item.flag ? `${item.flag}  ` : ''}${item.label}
              </option>`,
          )}
        </select>
        <span class="freedom-dropdown__chev" aria-hidden="true">▾</span>
      </div>
      ${hasError ? html`<span class="freedom-dropdown__error">${td.errors?.[0]}</span>` : null}
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
