import {
  FormWidget,
  FunctionWidget,
  isActionWidget,
  isFunctionWidget,
  isInputWidget,
  isLayoutWidget,
  LayoutWidget,
  NonFunctionWidget,
} from '../../form-widget';
import { I18nParams, I18nTranslator, isTranslationConfig } from '../../i18n';
import { isPotentialDotPath } from '../../utils/dot-path';
import { get, set } from '../../utils/object';
import { DerivedWidget, State } from '../model';
import { hasWhen } from './utils';

export const calculateWidgetProps =
  (localization: I18nTranslator) =>
  (state: State): State => {
    return { ...state, calculatedWidgets: calculateProps(state, localization) };
  };

const mkDerivedWidget = <F extends FormWidget<string>>(
  source: F,
  previous: Exclude<F, FunctionWidget<string>>,
): DerivedWidget<F> => ({
  source,
  previous,
  current: {} as Exclude<F, FunctionWidget<string>>,
  changed: false,
});

type CoreProp = keyof NonFunctionWidget;

function unsuffixedUniqueKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.map((k) => k.split('.')[0])));
}

function calculateProps(state: State, localization: I18nTranslator) {
  return Object.keys(state.calculatedWidgets).reduce(
    (acc, uid) => {
      if (state.widgetFlags[uid] !== undefined && state.widgetFlags[uid].hidden) {
        return acc;
      }

      const originalDerivedWidget = state.calculatedWidgets[uid];
      const originalSource = originalDerivedWidget.source;

      if (isFunctionWidget(originalSource)) {
        originalDerivedWidget.previous = originalDerivedWidget.current;
        originalDerivedWidget.current = originalSource({
          $form: state.data,
          errors: originalSource.path ? state.validations[originalSource.path] : undefined,
          touched: originalSource.path ? state.touchedControls[originalSource.path] : undefined,
          translate: localization.translate,
        });
        originalDerivedWidget.current.uid = uid;
        // TODO: structural comparison to avoid change detection
        acc[uid] = { ...originalDerivedWidget };
        return acc;
      }

      const derivedWidget = mkDerivedWidget(
        originalSource,
        // previous is the new current
        originalDerivedWidget.current,
      );

      // TODO: Optimize: we know in advanced which suffixable core properties exist
      // Widget core properties
      unsuffixedUniqueKeys(Object.keys(originalSource))
        .filter((prop) => prop !== 'props' && prop !== 'on')
        .forEach((prop) => {
          calculateProperty({
            currentStates: state.currentStates,
            widgetPropOverrides: state.widgetPropOverrides,
            derivedWidget: derivedWidget,
            property: prop as CoreProp,
            $form: state.data,
            widgetFlags: state.widgetFlags,
            localization,
          });
        });

      // Widget "props" properties
      const props = {
        ...(originalSource.props || {}),
        // We may have overridden properties that aren't set on the original object, so we need to account for them
        ...state.widgetPropOverrides[originalSource.uid],
      };
      unsuffixedUniqueKeys(Object.keys(props)).forEach((prop) => {
        calculateProperty({
          currentStates: state.currentStates,
          widgetPropOverrides: state.widgetPropOverrides,
          derivedWidget: derivedWidget,
          property: 'props',
          subProp: prop,
          $form: state.data,
          widgetFlags: state.widgetFlags,
          localization,
        });
      });

      // Widget "on" properties
      if (isInputWidget(originalSource) || isActionWidget(originalSource)) {
        unsuffixedUniqueKeys(Object.keys(originalSource.on || {})).forEach((prop) => {
          calculateProperty({
            currentStates: state.currentStates,
            widgetPropOverrides: state.widgetPropOverrides,
            derivedWidget: derivedWidget,
            property: 'on' as CoreProp, // TODO: type hack: "on" is not a CoreProp
            subProp: prop,
            $form: state.data,
            widgetFlags: state.widgetFlags,
            localization,
          });
        });
      }

      // Layout "children" property
      if (isLayoutWidget(originalSource)) {
        const prevChildren = (derivedWidget.previous as LayoutWidget<string>).children || [];

        // Calculate visible children based on current flags
        const children = originalSource.children.filter((child) => {
          // TODO: why were we doing this??? It doesn't make logical sense
          // if (isFunctionWidget(child)) {
          //   child = child({
          //     $form: state.data,
          //     errors: child.path ? state.validations[child.path] : undefined,
          //     touched: child.path ? state.touchedControls[child.path] : undefined,
          //     translate: localization.translate,
          //   });
          // }
          return !state.widgetFlags[child.uid!] || state.widgetFlags[child.uid!].hidden !== true;
        });

        (derivedWidget as DerivedWidget<LayoutWidget<string>>).current.children = children;

        // Reflect structural equality changes
        derivedWidget.changed =
          prevChildren.length !== children.length ||
          !children.every(
            (_, index) => prevChildren[index] && prevChildren[index].uid === children[index].uid,
          );
      }

      // If there are no changes we can keep the old widget reference to avoid unnecessary rerendering
      acc[uid] = derivedWidget.changed ? derivedWidget : originalDerivedWidget;
      delete acc[uid].changed;
      return acc;
    },
    {} as State['calculatedWidgets'],
  );
}

/**
 * Computes a widget property based on the current calculated states
 * and determines whether the result differs from the previous computation.
 *
 * The returned value is compared against the previously computed value to
 * determine if a change has occurred. This allows to decide later on whether
 * a new object reference should be created (for ref equality change detection)
 */
function calculateProperty<F extends NonFunctionWidget<string>>({
  currentStates,
  widgetPropOverrides,
  derivedWidget,
  property,
  subProp,
  $form,
  widgetFlags,
  localization,
}: {
  currentStates: string[];
  widgetPropOverrides: State['widgetPropOverrides'];
  derivedWidget: DerivedWidget<F>;
  property: CoreProp;
  subProp?: string;
  $form: State['data'];
  widgetFlags: State['widgetFlags'];
  localization: I18nTranslator;
}) {
  // TODO: Does this assumption holds?
  // Longer props are more relevant because "register" vs "register:adult" vs "register:adult:termsAccepted"
  const matchedState = currentStates
    .sort((a, b) => b.length - a.length)
    .find((currentState) => {
      const currentStateValue = subProp
        ? derivedWidget.source?.[property as 'props' /* | 'on' */]?.[`${subProp}.${currentState}`]
        : derivedWidget.source[`${property}.${currentState}` as CoreProp];
      return currentStateValue !== undefined;
    });

  let propValue: any;
  // if no matching state is found, we use the property as is, without suffix
  if (matchedState === undefined) {
    propValue = subProp
      ? derivedWidget.source[property as 'props']?.[subProp]
      : derivedWidget.source[property];
  } else {
    propValue = subProp
      ? derivedWidget.source[property as 'props' /* | 'on */]?.[`${subProp}.${matchedState}`]
      : derivedWidget.source[`${property}.${matchedState}` as CoreProp];
  }

  const dotPath = subProp ? `${property}.${subProp}` : property;

  if (typeof propValue === 'function') {
    set(derivedWidget.current, dotPath, propValue({ $form, translate: localization.translate }));
  } else {
    // TODO: is this too naive? it only checks for the existence of `{key: string;}`
    if (isTranslationConfig(propValue)) {
      propValue = localization.translate(
        propValue.key,
        resolveI18nParams(propValue.params, $form),
        propValue.default,
      );
    }
    // This is for `disabled` an `readonly`
    // TODO: `disabled` an `readonly` don't need to be kept in state['flags'], we could calculate them right here
    if (
      ((property as string) === 'disabled' || (property as string) === 'readonly') &&
      hasWhen(propValue)
    ) {
      propValue = widgetFlags[derivedWidget.current.uid][property as 'disabled' | 'readonly'];
    }
    set(derivedWidget.current, dotPath, propValue);
  }

  if (
    property === 'props' &&
    subProp &&
    widgetPropOverrides[derivedWidget.source.uid] &&
    widgetPropOverrides[derivedWidget.source.uid][subProp] !== undefined
  ) {
    set(derivedWidget.current, dotPath, widgetPropOverrides[derivedWidget.source.uid][subProp]);
  }

  // TODO: this only takes into account primitives, what happens with objects and arrays that are structurally equivalent?
  if (get(derivedWidget.previous, dotPath) !== get(derivedWidget.current, dotPath)) {
    derivedWidget.changed = true;
  }
}

/**
 * Resolves i18n interpolation parameters to concrete values.
 *
 * Each parameter value may either be a literal (string or number) or a
 * property path that is looked up in the provided form state.
 * References are replaced with their resolved values, while literal
 * values are passed through unchanged.
 *
 * If `params` is `undefined`, the function returns `undefined`.
 */
const resolveI18nParams = (
  params: I18nParams | undefined,
  // TODO: if we also target $error and $meta this should be State not State['data']
  data: State['data'],
): I18nParams | undefined => {
  if (!params) {
    return params;
  }
  return Object.keys(params).reduce((acc, key) => {
    const path = String(params[key]);
    if (isPotentialDotPath(path)) {
      // TODO: temporary while we accomodate other prefixes
      const pathWithout$form = path.replace('$form.', '');
      acc[key] = get(data, pathWithout$form) || path;
    } else {
      acc[key] = path;
    }
    return acc;
  }, {} as I18nParams);
};
