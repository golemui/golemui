export interface ListItemRendererProps<T> {
  template: T;
  value: string | number;
  index: number;
  selected?: boolean;
  disabled?: boolean;
  focused?: boolean;
}
