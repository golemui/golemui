import type { InputWidget, WithWidget } from '@golemui/core';
import { type RepeaterProps } from '@golemui/gui-shared/internals';
import { formContext, inputContext, InputWidgetAdapter, type LitFormContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import '@golemui/gui-components/label';
import '@golemui/gui-components/errors';

export class RepeaterElement extends LitElement implements WithWidget {
  widget!: InputWidget<Record<string, unknown>[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<Record<string, unknown>[], RepeaterProps<any>>();

  @state() isFocused = false;

  @query('.gui-repeater__main-card') private _repeaterRef!: any;

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
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

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-repeater', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  onFocusIn(event: FocusEvent) {
    event.stopPropagation();
    this.isFocused = true;
  }

  onFocusOut(event: FocusEvent) {
    event.stopPropagation();
    this.adapter.onBlur();
    this.isFocused = false;
  }

  override render() {
    const templateData = this.adapter.templateData;
    const showErrors =
      templateData.touched && templateData.errors && templateData.errors.length > 0;

    return html`
      <div
        id=${this.widget.uid}
        class=${`gui-repeater__main-card gui-repeater__card ${this.isFocused ? 'gui-repeater__card--focused' : ''}`}
        @focusin=${this.onFocusIn}
        @focusout=${this.onFocusOut}
      >
        <gui-label
          .targetElement=${[this._repeaterRef]}
          .uid=${this.widget.uid}
          .label=${templateData.label}
          .errors=${templateData.errors}
          .touched=${templateData.touched}
          .required=${templateData.validator?.required}
          .native=${false}
        ></gui-label>
        ${repeat(
          templateData.rows ?? [],
          (row) => row.uid,
          (row, index) => html`
            <div class="gui-repeater__card">
              <div class="gui-repeater__card-header">
                ${templateData.title
                  ? html`<span class="gui-repeater__card-title"
                      >${templateData.title} ${index + 1}</span
                    >`
                  : nothing}
                <button
                  type="button"
                  tabindex="0"
                  class="gui-button gui-button--sm gui-repeater__remove-btn"
                  @click=${() => this.removeItem(index)}
                >
                  ${templateData.removeButtonIcon
                    ? html`<span
                        class="gui-widget-icon gui-button-icon ${templateData.removeButtonIcon}"
                        data-icon=${templateData.removeButtonIcon}
                      ></span>`
                    : nothing}
                  ${templateData.removeLabel ?? 'Remove'}
                </button>
              </div>
              <gui-widget .widget=${row}></gui-widget>
            </div>
          `,
        )}

        <button
          type="button"
          tabindex="0"
          class="gui-button gui-repeater__add-btn"
          @click=${() => this.addItem()}
          ?disabled=${!!(templateData.limit && templateData.limit === templateData.value?.length)}
        >
          ${templateData.addButtonIcon
            ? html`<span
                class="gui-widget-icon gui-button-icon ${templateData.addButtonIcon}"
                data-icon=${templateData.addButtonIcon}
              ></span>`
            : nothing}
          ${templateData.addLabel ?? 'Add'}
        </button>
      </div>
      ${showErrors
        ? html`<gui-errors
            .uid=${this.widget.uid}
            .errors=${templateData.errors}
            .touched=${templateData.touched}
          ></gui-errors>`
        : nothing}
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
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

safeDefine('gui-repeater-input', RepeaterElement);
