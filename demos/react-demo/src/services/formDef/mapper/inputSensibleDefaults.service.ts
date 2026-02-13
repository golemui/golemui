import { InputDecorator } from '../formDef.domain';
import { InputSensibleDefaults } from '../fomConfig.domain';

export class InputSensibleDefaultsService {
  private sensibleDefaultValueForProperty<K extends keyof InputDecorator>(
    item: InputDecorator,
    actsOn: K,
    shouldSuppress: boolean | undefined,
    valueProvider: (item: InputDecorator) => InputDecorator[K],
  ): InputDecorator {
    // If it already has a value, we don't touch it
    if (item[actsOn] != null) {
      return item;
    }

    // Let's revert the semantics to make the code easier to read.
    const shouldAddSensibleDefault = shouldSuppress !== true;

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

  public processAutomaticLabels(item: InputDecorator, currentConfig: InputSensibleDefaults) {
    return this.sensibleDefaultValueForProperty(
      item,
      'label',
      currentConfig.suppressAutomaticLabels,
      (item) => item.path,
    );
  }

  public processAutomaticPlaceholders(item: InputDecorator, currentConfig: InputSensibleDefaults) {
    // The automatic placeholder is only added if the label is not present.
    if (item.label != null) return item;
    return this.sensibleDefaultValueForProperty(
      item,
      'placeholder',
      currentConfig.suppressAutomaticPlaceholders,
      (item) => item.path,
    );
  }
}

const formInputHintsDecoratorsService = new InputSensibleDefaultsService();
export default formInputHintsDecoratorsService;
