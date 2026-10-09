import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { MultiListProps, OptionValue } from '@golemui/gui-shared/internals';
import type { GuiVisibleItem } from '@golemui/gui-components';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { cspStyleMap, safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import { defaultMultiListItemRenderer } from './default-multi-list-item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/multi-list';
import '@golemui/gui-components/errors';
import { live } from 'lit/directives/live.js';

export class MultiListElement extends LitElement implements WithWidget {
  widget!: InputWidget<OptionValue[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<OptionValue[], MultiListProps<any>>();

  subscriptions: Subscription[] = [];

  @state() private _visibleItems: GuiVisibleItem<any>[] = [];

  @query('gui-multi-list') private _guiListRef!: any;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-multi-list-widget', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }

  override render() {
    const templateData = this.adapter.templateData;
    const showErrors =
      templateData.touched && templateData.errors && templateData.errors.length > 0;
    const values = this._currentValues();

    const itemRenderer = this.adapter.getItemRenderer(
      templateData.itemRenderer,
      defaultMultiListItemRenderer,
    );

    return html`
      <gui-label
        .targetElement=${this._guiListRef}
        .uid=${this.widget.uid}
        .label=${templateData.label}
        .hint=${templateData.hint}
        .errors=${templateData.errors}
        .touched=${templateData.touched}
        .required=${templateData.validator?.required}
        .disabled=${templateData.disabled}
        .readOnly=${templateData.readonly}
        .native=${false}
      ></gui-label>

      <div class="gui-widget">
        <gui-multi-list
          .uid=${this.widget.uid}
          .values=${live(values)}
          .valueField=${templateData.valueField as string}
          .items=${templateData.items}
          .itemHeight=${templateData.itemHeight}
          .height=${templateData.height}
          ?required=${templateData.validator?.required}
          .touched=${templateData.touched}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          aria-labelledby=${templateData.label ? `${this.widget.uid}_label` : nothing}
          aria-describedby=${templateData.hint ? `${this.widget.uid}_hint` : nothing}
          @gui-visible-items-change=${this._onVisibleItemsChange}
          @gui-blur=${() => this.adapter.onBlur()}
          @gui-item-toggle=${this._valueChanged}
        >
          ${this._visibleItems.map((item) => {
            const labelField = templateData.labelField ?? 'label';
            const isObject = item.template !== null && typeof item.template === 'object';
            const template =
              isObject && labelField && !templateData.itemRenderer
                ? item.template[labelField]
                : item.template;

            return html`
              <div
                role="option"
                tabindex="-1"
                class="gui-list__item-wrapper"
                id=${item.id}
                style=${cspStyleMap({ height: `${templateData.itemHeight || 40}px` })}
                aria-selected=${item.selected ? 'true' : 'false'}
                aria-disabled=${item.disabled ? 'true' : 'false'}
              >
                ${itemRenderer({
                  template: template as string,
                  value: item.value,
                  index: item.index,
                  selected: item.selected,
                  disabled: item.disabled,
                  focused: item.focused,
                })}
              </div>
            `;
          })}
        </gui-multi-list>
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

  private _currentValues(): OptionValue[] {
    const value = this.adapter.templateData.value;
    return Array.isArray(value) ? value : [];
  }

  private _toggleValue(value: OptionValue) {
    const templateData = this.adapter.templateData;
    if (templateData.disabled || templateData.readonly) return;

    const current = this._currentValues();
    if (current.includes(value)) {
      this.adapter.valueChanged(current.filter((v) => v !== value));
      return;
    }
    this.adapter.valueChanged([...current, value]);
  }

  private _onVisibleItemsChange(e: CustomEvent<GuiVisibleItem<any>[]>) {
    this._visibleItems = e.detail;
  }

  private _valueChanged(e: CustomEvent) {
    if (!this.adapter.templateData.readonly) {
      this._toggleValue(e.detail.value);
    }
  }
}

safeDefine('gui-multi-list-input', MultiListElement);
