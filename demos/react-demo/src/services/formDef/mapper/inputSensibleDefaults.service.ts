import { InputDef } from '../formDef.domain';
import { FormConfig } from '../fomConfig.domain';

export class InputSensibleDefaults {
  private sensibleDefaultValueForProperty<K extends keyof InputDef>(
    item: InputDef,
    actsOn: K,
    shouldSuppress: boolean | undefined,
    valueProvider: (item: InputDef) => InputDef[K],
  ): InputDef {
    // If it already has a value, we don't touch it
    if (item[actsOn] != null) {
      return item;
    }

    // Let's revert the semantics to make the code easier to read.
    const shouldAddSensibleDefault = shouldSuppress === false;

    // From this point the current item definition does NOT have a value.
    // If we should NOT add a sensible default, then, leave it as it is
    if (!shouldAddSensibleDefault) {
      return item;
    }

    // This is the hands-on case, populate the property with the sensible default
    return {
      ...item,
      [actsOn]: valueProvider(item),
    };
  }

  public processAutomaticLabels<FormData extends Record<string, any> = any>(
    item: InputDef,
    currentConfig: FormConfig<FormData>,
  ) {
    return this.sensibleDefaultValueForProperty(
      item,
      'label',
      currentConfig.suppressAutomaticLabels,
      (item) => item.path
    );
  }

  public processAutomaticPlaceholders<FormData extends Record<string, any> = any>(
    item: InputDef,
    currentConfig: FormConfig<FormData>,
  ) {
    return this.sensibleDefaultValueForProperty(
      item,
      'placeholder',
      currentConfig.suppressAutomaticPlaceholders,
      (item) => item.path
    );
  }
}

const formInputHintsDecoratorsService = new InputSensibleDefaults();
export default formInputHintsDecoratorsService;
