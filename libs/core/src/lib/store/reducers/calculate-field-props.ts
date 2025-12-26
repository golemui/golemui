import { FormField, isControlField, isInteractiveField } from '../../form-field';
import { get, set } from '../../utils/object';
import { DerivedField, State } from '../model';

export const calculateFieldProps = (state: State): State => {
  return { ...state, calculatedFields: calculateProps(state) };
};

const mkDerivedField = <F extends FormField<string>>(source: F, previous: F): DerivedField<F> => ({
  source,
  previous,
  current: {} as F,
  changed: false,
});

type CoreProp = keyof FormField;

function unsuffixedUniqueKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.map((k) => k.split('.')[0])));
}

function calculateProps(state: State) {
  return Object.keys(state.calculatedFields).reduce(
    (acc, uid) => {
      if (state.fieldFlags[uid] !== undefined && state.fieldFlags[uid].hidden) {
        return acc;
      }

      const originalDerivedField = state.calculatedFields[uid];
      const derivedField = mkDerivedField(
        originalDerivedField.source,
        originalDerivedField.previous,
      );

      // TODO: Optimize: we know in advanced which suffixable core properties exist
      // Field core properties
      unsuffixedUniqueKeys(Object.keys(derivedField.source))
        .filter((prop) => prop !== 'props' && prop !== 'on')
        .forEach((prop) => {
          calculateProperty({
            currentStates: state.currentStates,
            fieldPropOverrides: state.fieldPropOverrides,
            derivedField,
            property: prop as CoreProp,
            $form: state.data,
          });
        });

      // Field "props" properties
      const props = {
        ...(derivedField.source.props || {}),
        // We may have overridden properties that aren't set on the original object, so we need to account for them
        ...state.fieldPropOverrides[derivedField.source.uid],
      };
      unsuffixedUniqueKeys(Object.keys(props)).forEach((prop) => {
        calculateProperty({
          currentStates: state.currentStates,
          fieldPropOverrides: state.fieldPropOverrides,
          derivedField,
          property: 'props',
          subProp: prop,
          $form: state.data,
        });
      });

      // Field "on" properties
      if (isControlField(derivedField.source) || isInteractiveField(derivedField.source)) {
        unsuffixedUniqueKeys(Object.keys(derivedField.source.on || {})).forEach((prop) => {
          calculateProperty({
            currentStates: state.currentStates,
            fieldPropOverrides: state.fieldPropOverrides,
            derivedField,
            property: 'on' as CoreProp, // TODO: type hack: "on" is not a CoreProp
            subProp: prop,
            $form: state.data,
          });
        });
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
function calculateProperty<F extends FormField<string>>({
  currentStates,
  fieldPropOverrides,
  derivedField,
  property,
  subProp,
  $form,
}: {
  currentStates: string[];
  fieldPropOverrides: State['fieldPropOverrides'];
  derivedField: DerivedField<F>;
  property: CoreProp;
  subProp?: string;
  $form: State['data'];
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
    set(derivedField.current, dotPath, propValue({ $form }));
  } else {
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
