import React from 'react';
import { type ListItemRendererProps } from '@golemui/gui-react';
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
    <div className={cn(classes)}>
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
