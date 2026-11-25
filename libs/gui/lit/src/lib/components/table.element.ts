import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { consume, provide } from '@lit/context';
import {
  DisplayWidgetAdapter,
  type LitFormContext,
  displayWidgetContext,
  formContext,
} from '@golemui/lit';
import { tableCellClass, tableCellText, type TableProps } from '@golemui/gui-shared/internals';
import { type Subscription } from 'rxjs';
import '@golemui/gui-components/table';

export class TableElement extends LitElement implements WithWidget {
  widget!: DisplayWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: displayWidgetContext })
  adapter = new DisplayWidgetAdapter<TableProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-table', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const { caption, columns, rows, emptyMessage, lang } = this.adapter.templateData;
    const shown = columns ?? [];
    return html`<gui-table id=${this.adapter.domId}>
      <table>
        <caption>
          ${caption}
        </caption>
        <thead>
          <tr>
            ${shown.map(
              (column) =>
                html`<th scope="col" class=${tableCellClass(column) ?? nothing}>
                  ${column.label}
                </th>`,
            )}
          </tr>
        </thead>
        <tbody>
          ${rows?.length
            ? rows.map(
                (row) =>
                  html`<tr>
                    ${shown.map(
                      (column) =>
                        html`<td class=${tableCellClass(column) ?? nothing}>
                          ${tableCellText(row[column.key], column, lang)}
                        </td>`,
                    )}
                  </tr>`,
              )
            : emptyMessage
              ? html`<tr>
                  <td class="gui-table__empty" colspan=${shown.length}>${emptyMessage}</td>
                </tr>`
              : nothing}
        </tbody>
      </table>
    </gui-table>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-table-display', TableElement);
