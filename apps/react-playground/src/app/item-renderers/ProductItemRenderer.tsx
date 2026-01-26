import React from 'react';
import { ListItemRendererProps } from '@golemui/react-vanilla';
import './product-item-renderer.scss';
import { cn } from '@golemui/react';

type ProductItem = {
  product: string;
  description: string;
  price: string;
};

export function ProductItemRenderer({
  template,
  index,
  selected,
  disabled,
  focused,
}: ListItemRendererProps<ProductItem>) {
  const classes = {
    product: true,
    disabled: disabled,
    selected: selected,
    focused: focused,
    odd: index % 2 === 0,
  };

  return (
    <div role="option" className={cn(classes)} aria-selected={selected} aria-disabled={disabled}>
      <div>
        <h2>{template?.product}</h2>
        <p>{template?.description}</p>
      </div>
      <div>
        <p>{template?.price}</p>
      </div>
    </div>
  );
}
