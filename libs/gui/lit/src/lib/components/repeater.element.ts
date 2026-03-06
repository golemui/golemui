import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { getItemKey, RepeaterProps } from '@golemui/gui-shared';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

/**
 * Monotonically increasing counter for generating unique repeater item IDs.
 */
let nextRepeaterItemId = 0;
const idIncrementer = () => nextRepeaterItemId++;

@customElement('gui-repeater-input')
export class RepeaterElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<Record<string, unknown>[]>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<Record<string, unknown>[], RepeaterProps<any>>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-repeater');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override updated(changedProperties: any) {
    super.updated(changedProperties);

    const size = this.adapter.templateData.size;

    if (size) {
      this.style.flex = String(size);
    } else {
      this.style.removeProperty('flex');
    }
  }

  override render() {
    super.render();

    return html`
      <div id=${this.widget.uid}>
        <h2>${this.adapter.templateData.label}</h2>

        ${this.adapter.templateData.value
          ? repeat(
              this.adapter.templateData.value,
              (widget) => getItemKey(widget, idIncrementer),
              (_, index) => html`
                <div class="gui-repeater__card">
                  <div class="gui-repeater__card-header">
                    ${this.adapter.templateData.title
                      ? html`<span class="gui-repeater__card-title">${this.adapter.templateData.title} ${index + 1}</span>`
                      : nothing}
                    <button
                      type="button"
                      class="gui-button gui-repeater__remove-btn"
                      @click=${() => this.removeItem(index)}
                    >
                      ${this.adapter.templateData.removeButtonIcon
                        ? html`<span class="gui-button-icon ${this.adapter.templateData.removeButtonIcon}"></span>`
                        : nothing}
                      ${this.adapter.templateData.removeLabel ?? 'Remove'}
                    </button>
                  </div>
                  <gui-repeater-widget
                    .repeaterIndex=${index}
                    .widget=${this.adapter.templateData.template}
                  ></gui-repeater-widget>
                </div>
              `,
            )
          : nothing}

        <button
          type="button"
          class="gui-button gui-repeater__add-btn"
          @click=${() => this.addItem()}
          ?disabled=${!!(
            this.adapter.templateData.limit &&
            this.adapter.templateData.limit === this.adapter.templateData.value?.length
          )}
        >
          ${this.adapter.templateData.addButtonIcon
            ? html`<span class="gui-button-icon ${this.adapter.templateData.addButtonIcon}"></span>`
            : nothing}
          ${this.adapter.templateData.addLabel ?? 'Add'}
        </button>
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private addItem() {
    const newValue = [...(this.adapter.templateData.value ?? []), {}];
    this.adapter.valueChanged(newValue);
    this.requestUpdate();
  }

  private removeItem(index: number) {
    const items = (this.adapter.templateData.value ?? []).filter((_, i) => index !== i);
    // Make sure we don't keep object references
    if ('structuredClone' in window) {
      this.adapter.valueChanged(structuredClone(items));
    } else {
      this.adapter.valueChanged(JSON.parse(JSON.stringify(items)));
    }
    this.requestUpdate();
  }
}
