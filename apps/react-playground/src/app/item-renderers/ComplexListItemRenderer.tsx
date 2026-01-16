import React from 'react';
import { ListItemRendererProps } from '@golemui/react-vanilla';
import './complex-list-item-renderer.scss';
import { cn } from '@golemui/react';

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
  const classes = {
    'my-custom-class': true,
    disabled: disabled,
    selected: selected,
    focused: focused,
    odd: index % 2 === 0,
  };

  return (
    <div role="option" className={cn(classes)} aria-selected={selected} aria-disabled={disabled}>
      <h2>{template?.title}</h2>
      <p>{template?.description}</p>
    </div>
  );
}
