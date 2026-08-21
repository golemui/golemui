import { type FormWidget } from '../../form-widget';
import { inputPath } from '../../utils/form';
import type { OVERRIDE_WIDGET_PROP } from '../actions';
import { type DerivedWidget, type State } from '../model';

export const overrideWidgetProp = (state: State, { payload }: OVERRIDE_WIDGET_PROP): State => {
  let widget: DerivedWidget<FormWidget<string, any, any>> | undefined;

  if ('path' in payload) {
    widget = Object.values(state.calculatedWidgets).find(
      ({ source, current }) => (inputPath(current) ?? inputPath(source)) === payload.path,
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

  const uid = widget.source.uid as string;
  const propOverrides = state.widgetPropOverrides[uid] || {};
  return {
    ...state,
    widgetPropOverrides: {
      ...state.widgetPropOverrides,
      [uid]: { ...propOverrides, [payload.prop]: payload.value },
    },
  };
};
