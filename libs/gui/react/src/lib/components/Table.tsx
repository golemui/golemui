import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/react';
import { tableCellClass, tableCellText, type TableProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/table';

export function Table(widgetInstance: WithWidget) {
  const widget = widgetInstance.widget as DisplayWidget;
  const { domId, templateData } = useDisplayWidget<TableProps>(widget);
  const { caption, rows, emptyMessage, lang } = templateData;
  const columns = templateData.columns ?? [];

  // The plain tag: its children are the app's table, which React renders.
  return (
    <div className="gui-table gui-field">
      <gui-table id={domId}>
        <table>
          <caption>{caption as string}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={tableCellClass(column)}>
                  {column.label as string}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className={tableCellClass(column)}>
                      {tableCellText(row[column.key], column, lang)}
                    </td>
                  ))}
                </tr>
              ))
            ) : emptyMessage ? (
              <tr>
                <td className="gui-table__empty" colSpan={columns.length}>
                  {emptyMessage as string}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </gui-table>
    </div>
  );
}
