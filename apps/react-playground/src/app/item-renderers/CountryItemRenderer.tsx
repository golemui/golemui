import React from 'react';
import { ListItemRendererProps } from '@golemui/react-vanilla';
import './country-item-renderer.scss';
import { cn } from '@golemui/react';

type CountryItem = {
  id: string;
  label: string;
  flag: string;
};

export function CountryItemRenderer({
  template,
  index,
  selected,
  disabled,
  focused,
}: ListItemRendererProps<CountryItem>) {
  const classes = {
    'country-renderer': true,
    disabled: disabled,
    selected: selected,
    focused: focused,
    odd: index % 2 === 0,
  };

  return (
    <div className={cn(classes)}>
      <span>{template?.label}</span>
      <span>{template?.flag}</span>
    </div>
  );
}
