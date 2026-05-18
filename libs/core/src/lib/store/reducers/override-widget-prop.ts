import { type FormWidget, isInputWidget } from '../../form-widget';
import type * as Actions from '../actions';
import { type DerivedWidget, type State } from '../model';

export const overrideWidgetProp = (
  state: State,
  { payload }: Actions.OVERRIDE_WIDGET_PROP,
): State => {
  let widget: DerivedWidget<FormWidget<string, any, any>> | undefined;

  if ('path' in payload) {
    widget = Object.values(state.calculatedWidgets).find(
      ({ source }) => isInputWidget(source) && source.path === payload.path,
    );
    if (!widget) {
      console.warn(`Input with path "${payload.path}" not found`);
      return state;
    }
  } else {
    widget = state.calculatedWidgets[payload.uid];
    if (!widget) {
      console.warn(`Widget with uid "${payload.uid}" not found`);
      return state;
    }
  }

  const propOverrides = state.widgetPropOverrides[widget.source.uid!] || {};
  return {
    ...state,
    widgetPropOverrides: {
      ...state.widgetPropOverrides,
      [widget.source.uid!]: { ...propOverrides, [payload.prop]: payload.value },
    },
  };
};
