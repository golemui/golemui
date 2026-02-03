import { isInputWidget } from '../../form-widget';
import * as Actions from '../actions';
import { State } from '../model';

// TODO: refactor, we may also want to override widget's or layout's props, not only controls'. So don't use doPath, use uid in the action.
export const overrideWidgetProp = (
  state: State,
  { payload }: Actions.OVERRIDE_WIDGET_PROP,
): State => {
  const widget = Object.values(state.calculatedWidgets).find(
    ({ source }) => isInputWidget(source) && source.path === payload.path,
  );
  if (!widget) {
    console.warn(`Control "${payload.path}" not found`);
    return state;
  }
  const propOverrides = state.widgetPropOverrides[widget.source.uid!] || {};
  return {
    ...state,
    widgetPropOverrides: {
      [widget.source.uid!]: { ...propOverrides, [payload.prop]: payload.value },
    },
  };
};
