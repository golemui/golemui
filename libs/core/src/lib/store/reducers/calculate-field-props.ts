import { FormField, isControlField, isInteractiveField } from '../../form-field';
import { get, set } from '../../utils/object';
import { State } from '../model';

export const calculateFieldProps = (state: State): State => {
  return { ...state, calculatedFields: calculateProps(state) };
};

/**
 * Represents the result of a derived or computed calculation.
 *
 * A `Computed<T>` wraps a calculated value together with metadata indicating
 * whether the value differs from its previous version based on a structural
 * comparison performed during the computation.
 */
type Computed<F extends FormField<string>> = {
  /** The original value to compare to */
  original: Readonly<F>;
  /** The previous computed (derived) value */
  oldComputation: Readonly<F>;
  /** The computed (derived) value */
  newComputation: F;
  /** Keep track of the structural equality between old and new  */
  changed: boolean;
};

const mkComputed = <F extends FormField<string>>(original: F, oldComputation: F): Computed<F> => ({
  original,
  oldComputation,
  newComputation: {} as F,
  changed: false,
});

type CoreProp = keyof FormField;

function unsuffixedUniqueKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.map((k) => k.split('.')[0])));
}

function calculateProps(state: State) {
  return Object.keys(state.fields).reduce(
    (acc, uid) => {
      const computed = mkComputed(state.fields[uid], state.calculatedFields[uid] || {});

      // TODO: Optimize: we know in advanced which suffixable core properties exist
      // Field core properties
      unsuffixedUniqueKeys(Object.keys(computed.original))
        .filter((prop) => prop !== 'props' && prop !== 'on')
        .forEach((prop) => {
          calculateProperty({
            currentStates: state.currentStates,
            computed,
            property: prop as CoreProp,
            $form: state.data,
          });
        });

      // Field "props" properties
      unsuffixedUniqueKeys(Object.keys(computed.original.props || {})).forEach((prop) => {
        calculateProperty({
          currentStates: state.currentStates,
          computed,
          property: 'props',
          subProp: prop,
          $form: state.data,
        });
      });

      // Field "on" properties
      if (isControlField(computed.original) || isInteractiveField(computed.original)) {
        unsuffixedUniqueKeys(Object.keys(computed.original.on || {})).forEach((prop) => {
          calculateProperty({
            currentStates: state.currentStates,
            computed,
            property: 'on' as CoreProp, // TODO: type hack: "on" is not a CoreProp
            subProp: prop,
            $form: state.data,
          });
        });
      }

      // If there are no changes we can keep the old field reference to avoid unnecessary rerendering
      acc[uid] = computed.changed ? computed.newComputation : computed.oldComputation;
      console.log(acc[uid]);
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
  computed,
  property,
  subProp,
  $form,
}: {
  currentStates: string[];
  computed: Computed<F>;
  property: CoreProp;
  subProp?: string;
  $form: Record<string, any>;
}) {
  // TODO: Does this assumption holds?
  // Longer props are more relevant because "register" vs "register:adult" vs "register:adult:termsAccepted"
  const matchedState = currentStates
    .sort((a, b) => b.length - a.length)
    .find((currentState) => {
      const currentStateValue = subProp
        ? computed.original?.[property as 'props' /* | 'on' */]?.[`${subProp}.${currentState}`]
        : computed.original[`${property}.${currentState}` as CoreProp];
      return currentStateValue !== undefined;
    });

  let propValue: any;
  // if no matching state is found, we use the property as is, without suffix
  if (matchedState === undefined) {
    propValue = subProp
      ? computed.original[property as 'props']?.[subProp]
      : computed.original[property];
  } else {
    propValue = subProp
      ? computed.original[property as 'props' /* | 'on */]?.[`${subProp}.${matchedState}`]
      : computed.original[`${property}.${matchedState}` as CoreProp];
  }

  const dotPath = subProp ? `${property}.${subProp}` : property;

  if (typeof propValue === 'function') {
    set(computed.newComputation, dotPath, propValue({ $form }));
  } else {
    set(computed.newComputation, dotPath, propValue);
  }

  // TODO: this only takes into account primitives, what happens with objects and arrays that are structurally equivalent?
  if (get(computed.oldComputation, dotPath) !== get(computed.newComputation, dotPath)) {
    computed.changed = true;
  }
}
