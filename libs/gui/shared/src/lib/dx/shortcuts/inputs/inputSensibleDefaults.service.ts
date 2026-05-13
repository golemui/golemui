import { InputDecorator, InputSensibleDefaultsConfig } from './inputs.domain';
import {
  pathToLabel,
  processAutoLabel,
  processAutoPlaceholder,
} from '../../core/sharedSensibleDefaults.service';

export { pathToLabel };

export class InputSensibleDefaultsService {
  public processAutomaticLabels(item: InputDecorator, currentConfig: InputSensibleDefaultsConfig) {
    return processAutoLabel(item, currentConfig);
  }

  public processAutomaticPlaceholders(
    item: InputDecorator,
    currentConfig: InputSensibleDefaultsConfig,
  ) {
    return processAutoPlaceholder(item, currentConfig);
  }
}

const inputSensibleDefaultsService = new InputSensibleDefaultsService();
export default inputSensibleDefaultsService;
