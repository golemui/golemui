// TODO: We can probably remove this module entirely
import * as Core from '@golemui/core';
import * as Props from './widget.props';

type InputWidgetConfig<T> = Omit<
  Core.InputWidget<T>,
  'kind' | 'type' | 'uid' | 'props' | 'validator'
>;
type LayoutWidgetConfig = Omit<Core.LayoutWidget, 'kind' | 'type' | 'uid' | 'props'>;
type DisplayWidgetConfig = Omit<Core.BaseWidget, 'kind' | 'type' | 'uid' | 'props'>;

/**
 * Golem widget factory
 */
export const Golem = {
  //
  // Input widgets
  //
  textinput: <StateKeys extends Core.UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: InputWidgetConfig<string>;
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
  password: <StateKeys extends Core.UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: InputWidgetConfig<string>;
    props?: Props.PasswordProps;
    // validator?: Core.StringValidator | Core.CustomValidator;
    validator?: V;
  }): Core.InputWidget<string, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'password',
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
    config: InputWidgetConfig<number>;
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
    config: InputWidgetConfig<boolean>;
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
    config: InputWidgetConfig<string>;
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
  // Layout widgets
  //
  flex: <StateKeys extends Core.UiState = string>(
    config: LayoutWidgetConfig,
    props?: Props.FlexProps,
  ): Core.LayoutWidget<StateKeys> => ({
    uid: '',
    kind: 'layout',
    type: 'flex',
    ...(props && { props }),
    ...config,
  }),
  grid: <StateKeys extends Core.UiState = string>(
    config: LayoutWidgetConfig,
    props?: Props.GridProps,
  ): Core.LayoutWidget<StateKeys> => ({
    uid: '',
    kind: 'layout',
    type: 'grid',
    ...(props && { props }),
    ...config,
  }),
  tabs: <StateKeys extends Core.UiState = string>(
    config: LayoutWidgetConfig,
    props?: Props.TabsProps,
  ): Core.LayoutWidget<StateKeys> => ({
    uid: '',
    kind: 'layout',
    type: 'tabs',
    ...(props && { props }),
    ...config,
  }),

  //
  // Display widgets
  //
  alert: <StateKeys extends Core.UiState = string>(
    config: DisplayWidgetConfig,
    props?: Props.AlertProps,
  ): Core.DisplayWidget<StateKeys> => ({
    uid: '',
    kind: 'display',
    type: 'alert',
    ...(props && { props }),
    ...config,
  }),
  markdownText: <StateKeys extends Core.UiState = string>(
    config: DisplayWidgetConfig,
    props?: Props.MarkdownTextProps,
  ): Core.DisplayWidget<StateKeys> => ({
    uid: '',
    kind: 'display',
    type: 'markdownText',
    ...(props && { props }),
    ...config,
  }),
};
