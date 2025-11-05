export type ControlTemplateData<T> = {
  label?: string;
  value?: T;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
};
