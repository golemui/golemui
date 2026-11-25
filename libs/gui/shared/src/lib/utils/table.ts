/**
 * @internal Used by the framework table widgets, not part of the end-user public API.
 *
 * How the four adapters show a table's cells: the text of each cell, formatted in the form's
 * language, and the class that aligns it in `gui-table`.
 */
import type { TableCell, TableColumn } from '../widget.props';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const numberFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

/** A formatter for a language, cached, or one for `en` when the language isn't valid. */
function cached<F>(cache: Map<string, F>, lang: string, create: (lang: string) => F): F {
  let format = cache.get(lang);
  if (!format) {
    try {
      format = create(lang);
    } catch {
      format = create('en');
    }
    cache.set(lang, format);
  }
  return format;
}

/** A date from an ISO string: a bare date is a calendar day, so it is read and shown in UTC. */
function parseDate(value: string): { date: Date; utc: boolean } | undefined {
  const utc = ISO_DATE.test(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : { date, utc };
}

function formatNumber(value: TableCell, lang: string): string | undefined {
  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : NaN;
  if (!Number.isFinite(number)) return undefined;
  return cached(numberFormats, lang, (l) => new Intl.NumberFormat(l)).format(number);
}

function formatDate(value: TableCell, lang: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = parseDate(value);
  if (!parsed) return undefined;
  const key = `${lang}|${parsed.utc ? 'utc' : 'local'}`;
  const format = cached(dateFormats, key, () => {
    const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
    if (parsed.utc) options.timeZone = 'UTC';
    return new Intl.DateTimeFormat(lang, options);
  });
  return format.format(parsed.date);
}

/**
 * The text of a cell: a number or a date formatted in the form's language, for a column of that
 * type, and any other value as it is. An empty cell (`null` or missing) is an empty string.
 *
 * @param value - The row's value under the column's key.
 * @param column - The column, for its type.
 * @param lang - The form's language, such as `en-US`.
 * @example
 * tableCellText(1280.5, { key: 'total', label: 'Total', type: 'number' }, 'de-DE'); // '1.280,5'
 */
export function tableCellText(
  value: TableCell | undefined,
  column: Pick<TableColumn, 'type'>,
  lang: string | undefined,
): string {
  if (value === null || value === undefined) return '';
  const language = lang || 'en';
  const formatted =
    column.type === 'number'
      ? formatNumber(value, language)
      : column.type === 'date'
        ? formatDate(value, language)
        : undefined;
  return formatted ?? String(value);
}

/**
 * The class that aligns a column's cells in `gui-table`: its `align`, or `end` for a number
 * column without one. Undefined leaves the cell at the start.
 */
export function tableCellClass(column: Pick<TableColumn, 'align' | 'type'>): string | undefined {
  const align = column.align ?? (column.type === 'number' ? 'end' : undefined);
  return align && align !== 'start' ? `gui-table__cell--${align}` : undefined;
}
