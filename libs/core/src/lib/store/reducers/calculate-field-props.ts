import {
  FormField,
  FunctionField,
  isControlField,
  isFunctionField,
  isInteractiveField,
  isLayoutField,
  LayoutField,
  NonFunctionField,
} from '../../form-field';
import { I18nParams, I18nTranslator, isTranslationConfig } from '../../i18n';
import { isPotentialDotPath } from '../../utils/dot-path';
import { get, set } from '../../utils/object';
import { DerivedField, State } from '../model';

export const calculateFieldProps =
  (localization: I18nTranslator) =>
  (state: State): State => {
    return { ...state, calculatedFields: calculateProps(state, localization) };
  };

const mkDerivedField = <F extends FormField<string>>(
  source: F,
  previous: Exclude<F, FunctionField<string>>,
): DerivedField<F> => ({
  source,
  previous,
  current: {} as Exclude<F, FunctionField<string>>,
  changed: false,
});

type CoreProp = keyof NonFunctionField;

function unsuffixedUniqueKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.map((k) => k.split('.')[0])));
}

function calculateProps(state: State, localization: I18nTranslator) {
  return Object.keys(state.calculatedFields).reduce(
    (acc, uid) => {
      if (state.fieldFlags[uid] !== undefined && state.fieldFlags[uid].hidden) {
        return acc;
      }

      const originalDerivedField = state.calculatedFields[uid];
      const originalSource = originalDerivedField.source;

      if (isFunctionField(originalSource)) {
        originalDerivedField.previous = originalDerivedField.current;
        originalDerivedField.current = originalSource({
          $form: state.data,
          errors: originalSource.path ? state.validations[originalSource.path] : undefined,
          translate: localization.translate,
        });
        originalDerivedField.current.uid = uid;
        // TODO: structural comparison to avoid change detection
        acc[uid] = { ...originalDerivedField };
        return acc;
      }

      const derivedField = mkDerivedField(
        originalSource,
        // previous is the new current
        originalDerivedField.current,
      );

      // TODO: Optimize: we know in advanced which suffixable core properties exist
      // Field core properties
      unsuffixedUniqueKeys(Object.keys(originalSource))
        .filter((prop) => prop !== 'props' && prop !== 'on')
        .forEach((prop) => {
          calculateProperty({
            currentStates: state.currentStates,
            fieldPropOverrides: state.fieldPropOverrides,
            derivedField,
            property: prop as CoreProp,
            $form: state.data,
            localization,
          });
        });

      // Field "props" properties
      const props = {
        ...(originalSource.props || {}),
        // We may have overridden properties that aren't set on the original object, so we need to account for them
        ...state.fieldPropOverrides[originalSource.uid],
      };
      unsuffixedUniqueKeys(Object.keys(props)).forEach((prop) => {
        calculateProperty({
          currentStates: state.currentStates,
          fieldPropOverrides: state.fieldPropOverrides,
          derivedField,
          property: 'props',
          subProp: prop,
          $form: state.data,
          localization,
        });
      });

      // Field "on" properties
      if (isControlField(originalSource) || isInteractiveField(originalSource)) {
        unsuffixedUniqueKeys(Object.keys(originalSource.on || {})).forEach((prop) => {
          calculateProperty({
            currentStates: state.currentStates,
            fieldPropOverrides: state.fieldPropOverrides,
            derivedField,
            property: 'on' as CoreProp, // TODO: type hack: "on" is not a CoreProp
            subProp: prop,
            $form: state.data,
            localization,
          });
        });
      }

      // Layout "children" property
      if (isLayoutField(originalSource)) {
        const prevChildren = (derivedField.previous as LayoutField<string>).children || [];

        // Calculate visible children based on current flags
        const children = originalSource.children.filter((child) => {
          if (isFunctionField(child)) {
            child = child({
              $form: state.data,
              errors: child.path ? state.validations[child.path] : undefined,
            });
          }
          return !state.fieldFlags[child.uid] || state.fieldFlags[child.uid].hidden !== true;
        });

        (derivedField as DerivedField<LayoutField<string>>).current.children = children;

        // Reflect structural equality changes
        derivedField.changed =
          prevChildren.length !== children.length ||
          !children.every(
            (_, index) => prevChildren[index] && prevChildren[index].uid === children[index].uid,
          );
      }

      // If there are no changes we can keep the old field reference to avoid unnecessary rerendering
      acc[uid] = derivedField.changed ? derivedField : originalDerivedField;
      delete acc[uid].changed;
      return acc;
    },
    {} as State['calculatedFields'],
  );
}

/**
 * Computes a field property based on the current calculated states
 * and determines whether the result differs from the previous computation.
 *
 * The returned value is compared against the previously computed value to
 * determine if a change has occurred. This allows to decide later on whether
 * a new object reference should be created (for ref equality change detection)
 */
function calculateProperty<F extends NonFunctionField<string>>({
  currentStates,
  fieldPropOverrides,
  derivedField,
  property,
  subProp,
  $form,
  localization,
}: {
  currentStates: string[];
  fieldPropOverrides: State['fieldPropOverrides'];
  derivedField: DerivedField<F>;
  property: CoreProp;
  subProp?: string;
  $form: State['data'];
  localization: I18nTranslator;
}) {
  // TODO: Does this assumption holds?
  // Longer props are more relevant because "register" vs "register:adult" vs "register:adult:termsAccepted"
  const matchedState = currentStates
    .sort((a, b) => b.length - a.length)
    .find((currentState) => {
      const currentStateValue = subProp
        ? derivedField.source?.[property as 'props' /* | 'on' */]?.[`${subProp}.${currentState}`]
        : derivedField.source[`${property}.${currentState}` as CoreProp];
      return currentStateValue !== undefined;
    });

  let propValue: any;
  // if no matching state is found, we use the property as is, without suffix
  if (matchedState === undefined) {
    propValue = subProp
      ? derivedField.source[property as 'props']?.[subProp]
      : derivedField.source[property];
  } else {
    propValue = subProp
      ? derivedField.source[property as 'props' /* | 'on */]?.[`${subProp}.${matchedState}`]
      : derivedField.source[`${property}.${matchedState}` as CoreProp];
  }

  const dotPath = subProp ? `${property}.${subProp}` : property;

  if (typeof propValue === 'function') {
    set(derivedField.current, dotPath, propValue({ $form, translate: localization.translate }));
  } else {
    // TODO: is this too naive? it only checks for the existence of `{key: string;}`
    if (isTranslationConfig(propValue)) {
      propValue = localization.translate(
        propValue.key,
        resolveI18nParams(propValue.params, $form),
        propValue.default,
      );
    }
    set(derivedField.current, dotPath, propValue);
  }

  if (
    property === 'props' &&
    subProp &&
    fieldPropOverrides[derivedField.source.uid] &&
    fieldPropOverrides[derivedField.source.uid][subProp] !== undefined
  ) {
    set(derivedField.current, dotPath, fieldPropOverrides[derivedField.source.uid][subProp]);
  }

  // TODO: this only takes into account primitives, what happens with objects and arrays that are structurally equivalent?
  if (get(derivedField.previous, dotPath) !== get(derivedField.current, dotPath)) {
    derivedField.changed = true;
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
  $form: State['data'],
): I18nParams | undefined => {
  if (!params) {
    return params;
  }
  return Object.keys(params).reduce((acc, key) => {
    const path = String(params[key]);
    // TODO: Add support for $form, $error, $meta prefixes in path.
    if (isPotentialDotPath(path)) {
      acc[key] = get($form, path);
    } else {
      acc[key] = path;
    }
    return acc;
  }, {} as I18nParams);
};
