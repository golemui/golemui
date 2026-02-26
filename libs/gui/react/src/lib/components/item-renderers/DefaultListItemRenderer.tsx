import React from 'react';
import { ListItemRendererProps } from './props';
import { OptionValue } from '@golemui/gui-components';

export function DefaultListItemRenderer({
  template,
  selected,
  disabled,
  focused,
}: ListItemRendererProps<OptionValue>) {
  const classes = [
    'gui-list__item',
    disabled ? 'gui-list__item-disabled' : '',
    selected ? 'gui-list__item-selected' : '',
    focused ? 'gui-list__item-focused' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div role="option" className={classes} aria-selected={selected}>
      {template}
    </div>
  );
}
