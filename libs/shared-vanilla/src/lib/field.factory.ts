import * as Core from '@golemui/core';
import * as Props from './field.props';

type ControlFieldConfig<T> = Omit<
  Core.InputWidget<T>,
  'kind' | 'type' | 'uid' | 'props' | 'validator'
>;
type LayoutFieldConfig = Omit<Core.LayoutWidget, 'kind' | 'type' | 'uid' | 'props'>;
type DisplayFieldConfig = Omit<Core.BaseWidget, 'kind' | 'type' | 'uid' | 'props'>;

/**
 * Vanilla field factory
 */
export const Vanilla = {
  //
  // Control fields
  //
  textinput: <StateKeys extends Core.UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: ControlFieldConfig<string>;
    props?: Props.TextinputProps;
    // validator?: Core.StringValidator | Core.CustomValidator;
    validator?: V;
  }): Core.InputWidget<string, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'textinput',
    // The `props` key only exists in the returned object when `props` is actually provided
    ...(props && { props }),
    ...(validator && { validator }),
    ...config,
  }),
  numberinput: <StateKeys extends Core.UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: ControlFieldConfig<number>;
    props?: Props.NumberinputProps;
    // validator?: Core.NumberValidator | Core.CustomValidator;
    validator?: V;
  }): Core.InputWidget<number, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'numberinput',
    ...(props && { props }),
    ...(validator && { validator }),
    ...config,
  }),
  checkbox: <StateKeys extends Core.UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: ControlFieldConfig<boolean>;
    props?: Props.CheckboxProps;
    // validator?: Core.BooleanValidator | Core.CustomValidator;
    validator?: V;
  }): Core.InputWidget<boolean, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'checkbox',
    ...(props && { props }),
    ...(validator && { validator }),
    ...config,
  }),
  select: <StateKeys extends Core.UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: ControlFieldConfig<string>;
    props?: Props.SelectProps;
    // validator?: Core.StringValidator | Core.CustomValidator;
    validator?: V;
  }): Core.InputWidget<string, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'select',
    ...(props && { props }),
    ...(validator && { validator }),
    ...config,
  }),

  //
  // Layout fields
  //
  stack: <StateKeys extends Core.UiState = string>(
    config: LayoutFieldConfig,
    props?: Props.StackProps,
  ): Core.LayoutWidget<StateKeys> => ({
    uid: '',
    kind: 'layout',
    type: 'stack',
    ...(props && { props }),
    ...config,
  }),
  tabs: <StateKeys extends Core.UiState = string>(
    config: LayoutFieldConfig,
    props?: Props.TabsProps,
  ): Core.LayoutWidget<StateKeys> => ({
    uid: '',
    kind: 'layout',
    type: 'tabs',
    ...(props && { props }),
    ...config,
  }),

  //
  // Display fields
  //
  alert: <StateKeys extends Core.UiState = string>(
    config: DisplayFieldConfig,
    props?: Props.AlertProps,
  ): Core.DisplayWidget<StateKeys> => ({
    uid: '',
    kind: 'display',
    type: 'alert',
    ...(props && { props }),
    ...config,
  }),
};
