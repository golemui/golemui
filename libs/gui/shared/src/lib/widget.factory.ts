// TODO: We can probably remove this module entirely
import type { BaseWidget, DisplayWidget, InputWidget, LayoutWidget, UiState } from '@golemui/core'
import type { AlertProps, CheckboxProps, FlexProps, GridProps, MarkdownTextProps, NumberinputProps, PasswordProps, SelectProps, TabsProps, TextinputProps } from './widget.props'

type InputWidgetConfig<T> = Omit<
  InputWidget<T>,
  'kind' | 'type' | 'uid' | 'props' | 'validator'
>;
type LayoutWidgetConfig = Omit<LayoutWidget, 'kind' | 'type' | 'uid' | 'props'>;
type DisplayWidgetConfig = Omit<BaseWidget, 'kind' | 'type' | 'uid' | 'props'>;

/**
 * Golem widget factory
 */
export const GolemWidgets = {
  //
  // Input widgets
  //
  textinput: <StateKeys extends UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: InputWidgetConfig<string>;
    props?: TextinputProps;
    // validator?: Core.StringValidator | Core.CustomValidator;
    validator?: V;
  }): InputWidget<string, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'textinput',
    // The `props` key only exists in the returned object when `props` is actually provided
    ...(props && { props }),
    ...(validator && { validator }),
    ...config,
  }),
  password: <StateKeys extends UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: InputWidgetConfig<string>;
    props?: PasswordProps;
    // validator?: Core.StringValidator | Core.CustomValidator;
    validator?: V;
  }): InputWidget<string, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'password',
    // The `props` key only exists in the returned object when `props` is actually provided
    ...(props && { props }),
    ...(validator && { validator }),
    ...config,
  }),
  numberinput: <StateKeys extends UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: InputWidgetConfig<number>;
    props?: NumberinputProps;
    // validator?: Core.NumberValidator | Core.CustomValidator;
    validator?: V;
  }): InputWidget<number, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'numberinput',
    ...(props && { props }),
    ...(validator && { validator }),
    ...config,
  }),
  checkbox: <StateKeys extends UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: InputWidgetConfig<boolean>;
    props?: CheckboxProps;
    // validator?: Core.BooleanValidator | Core.CustomValidator;
    validator?: V;
  }): InputWidget<boolean, StateKeys> => ({
    uid: '',
    kind: 'input',
    type: 'checkbox',
    ...(props && { props }),
    ...(validator && { validator }),
    ...config,
  }),
  select: <StateKeys extends UiState = string, V = any>({
    config,
    props,
    validator,
  }: {
    config: InputWidgetConfig<string>;
    props?: SelectProps;
    // validator?: Core.StringValidator | Core.CustomValidator;
    validator?: V;
  }): InputWidget<string, StateKeys> => ({
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
  flex: <StateKeys extends UiState = string>(
    config: LayoutWidgetConfig,
    props?: FlexProps,
  ): LayoutWidget<StateKeys> => ({
    uid: '',
    kind: 'layout',
    type: 'flex',
    ...(props && { props }),
    ...config,
  }),
  grid: <StateKeys extends UiState = string>(
    config: LayoutWidgetConfig,
    props?: GridProps,
  ): LayoutWidget<StateKeys> => ({
    uid: '',
    kind: 'layout',
    type: 'grid',
    ...(props && { props }),
    ...config,
  }),
  tabs: <StateKeys extends UiState = string>(
    config: LayoutWidgetConfig,
    props?: TabsProps,
  ): LayoutWidget<StateKeys> => ({
    uid: '',
    kind: 'layout',
    type: 'tabs',
    ...(props && { props }),
    ...config,
  }),

  //
  // Display widgets
  //
  alert: <StateKeys extends UiState = string>(
    config: DisplayWidgetConfig,
    props?: AlertProps,
  ): DisplayWidget<StateKeys> => ({
    uid: '',
    kind: 'display',
    type: 'alert',
    ...(props && { props }),
    ...config,
  }),
  markdownText: <StateKeys extends UiState = string>(
    config: DisplayWidgetConfig,
    props?: MarkdownTextProps,
  ): DisplayWidget<StateKeys> => ({
    uid: '',
    kind: 'display',
    type: 'markdownText',
    ...(props && { props }),
    ...config,
  }),
};
