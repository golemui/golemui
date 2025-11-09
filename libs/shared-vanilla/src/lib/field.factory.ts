import { BaseField, ControlField, Field, LayoutField } from '@formforge/core';
import * as Props from './field.props';

type ControlFieldConfig<T> = Omit<ControlField<T>, 'kind' | 'widget' | 'uid' | 'props'>;
type LayoutFieldConfig = Omit<LayoutField, 'kind' | 'widget' | 'uid' | 'props'>;
type DisplayFieldConfig = Omit<BaseField, 'kind' | 'widget' | 'uid' | 'props'>;

/**
 * Vanilla field factory
 */
export const Vanilla = {
  // Control fields
  textinput: <T extends string>(
    config: ControlFieldConfig<T>,
    props?: Props.TextinputProps,
  ): ControlField<T> => ({
    uid: '',
    kind: 'control',
    widget: 'textinput',
    // The `props` key only exists in the returned object when `props` is actually provided
    ...(props && { props }),
    ...config,
  }),
  checkbox: <T extends boolean>(
    config: ControlFieldConfig<T>,
    props?: Props.CheckboxProps,
  ): ControlField<T> => ({
    uid: '',
    kind: 'control',
    widget: 'checkbox',
    ...(props && { props }),
    ...config,
  }),
  select: <T extends string>(
    config: ControlFieldConfig<T>,
    props?: Props.SelectProps,
  ): ControlField<T> => ({
    uid: '',
    kind: 'control',
    widget: 'select',
    ...(props && { props }),
    ...config,
  }),

  // Layout fields
  stack: (config: LayoutFieldConfig, props?: Props.StackProps): LayoutField => ({
    uid: '',
    kind: 'layout',
    widget: 'stack',
    ...(props && { props }),
    ...config,
  }),
  tabs: (config: LayoutFieldConfig, props?: Props.TabsProps): LayoutField => ({
    uid: '',
    kind: 'layout',
    widget: 'tabs',
    ...(props && { props }),
    ...config,
  }),

  // Display fields
  alert: (config: DisplayFieldConfig, props?: Props.AlertProps): Field => ({
    uid: '',
    kind: 'field',
    widget: 'alert',
    ...(props && { props }),
    ...config,
  }),
};
