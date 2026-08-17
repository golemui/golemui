import React from 'react';
import { type ListItemRendererProps } from './props';
import type { OptionValue } from '@golemui/gui-shared/internals';

export function DefaultMultiListItemRenderer({
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
      <span className="gui-list__item-check" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256">
          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
        </svg>
      </span>
      {template}
    </div>
  );
}
