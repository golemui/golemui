import React from 'react';
import { ListItemRendererProps } from '@golemui/react-vanilla';
import './airport-item-renderer.scss';
import { cn } from '@golemui/react';
import { AirportItem } from '@golemui/apps-shared';

export function AirportItemRenderer({
  template,
  index,
  selected,
  disabled,
  focused,
}: ListItemRendererProps<AirportItem>) {
  const classes = {
    airport: true,
    disabled: disabled,
    selected: selected,
    focused: focused,
    odd: index % 2 === 0,
  };

  return (
    <div className={cn(classes)}>
      <div>
        <p>{template?.name}</p>
      </div>
      <div>
        <h2>{template?.iata}</h2>
      </div>
    </div>
  );
}
