export interface ListItemRendererProps<T> {
  // template and value may be undefined while the list is loading items or
  // when virtualized rows haven't been populated yet — renderers should
  // handle that via optional chaining (`template?.foo`).
  template?: T;
  value?: string | number;
  index: number;
  selected?: boolean;
  disabled?: boolean;
  focused?: boolean;
}
