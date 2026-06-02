import { type ListItemRendererProps } from '@golemui/gui-react';
import type { CurrencyItem } from './composeForm';

// A custom renderer — the "custom widget" composition block. Slots into a
// plain dropdown via `itemRenderer: 'currency'`; no fork of the input.
export function CurrencyItemRenderer({
  template,
  selected,
  focused,
}: ListItemRendererProps<CurrencyItem>) {
  const classes = ['currency-item'];
  if (selected) classes.push('is-selected');
  if (focused) classes.push('is-focused');
  return (
    <div className={classes.join(' ')}>
      <span className="currency-item__symbol">{template?.symbol}</span>
      <span className="currency-item__code">{template?.code}</span>
      <span className="currency-item__name">{template?.name}</span>
    </div>
  );
}
