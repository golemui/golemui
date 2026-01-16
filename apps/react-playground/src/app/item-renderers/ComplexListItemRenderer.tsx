import React from 'react';
import { ListItemRendererProps } from '@golemui/react-vanilla';
import './complex-list-item-renderer.scss';

type ComplexItem = {
  title: string;
  description: string;
};

export function ComplexListItemRenderer({
  template,
  index,
  selected,
  disabled,
  focused,
}: ListItemRendererProps<ComplexItem>) {
  const classes = [
    'my-custom-class',
    disabled ? 'disabled' : '',
    selected ? 'selected' : '',
    focused ? 'focused' : '',
    index % 2 === 0 ? 'odd' : '',
  ]
    .filter((c) => c.length > 0)
    .join(' ');

  return (
    <div role="option" className={classes} aria-selected={selected} aria-disabled={disabled}>
      <h2>{template?.title}</h2>
      <p>{template?.description}</p>
    </div>
  );
}
