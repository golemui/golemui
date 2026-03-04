import { InputDecorator, InputSensibleDefaultsConfig } from './inputs.domain';

export class InputSensibleDefaultsService {
  private pathToLabel(path: string | undefined): string {
    if (!path) return '';
    return path
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

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

  public processAutomaticLabels(item: InputDecorator, currentConfig: InputSensibleDefaultsConfig) {
    return this.sensibleDefaultValueForProperty(
      item,
      'label',
      currentConfig.suppressAutomaticLabels,
      (item) => this.pathToLabel(item.path) as InputDecorator['label'],
    );
  }

  public processAutomaticPlaceholders(item: InputDecorator, currentConfig: InputSensibleDefaultsConfig) {
    return this.sensibleDefaultValueForProperty(
      item,
      'placeholder',
      currentConfig.suppressAutomaticPlaceholders,
      (item) => item.path as InputDecorator['placeholder'],
    );
  }
}

const inputSensibleDefaultsService = new InputSensibleDefaultsService();
export default inputSensibleDefaultsService;
