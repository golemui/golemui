import { ControllerDef, DataInputDefsByKey } from '../../formDef.domain';
import { ParsedDxShortcut, UnrolledControllers, UnrolledFields } from '../dx.domain';
import sensibleDefaults, { SensibleDefaults } from '../../default/sensibleDefaults.service';
import inputDefsByKeyService, { InputDefsByKeyService } from './helpers/inputDefsByKey.service';

export class DxWiringService {
  constructor(
    private readonly inputDefsByKeyService: InputDefsByKeyService,
    private readonly sensibleDefaults: SensibleDefaults,
  ) {}

  wireInputDefsByKey<T extends Record<string, any>>(
    inputDefsByKey: DataInputDefsByKey<T>,
    source: ParsedDxShortcut<DataInputDefsByKey<T>>,
  ): UnrolledFields {
    return this.inputDefsByKeyService.unroll(inputDefsByKey, source);
  }

  wireSubmitButton(
    payload: null | ControllerDef | (() => ControllerDef),
    source: ParsedDxShortcut<null | ControllerDef | (() => ControllerDef)>,
  ): UnrolledControllers {
    return {
      type: 'controllers',
      source,
      items: [payload == null ? this.sensibleDefaults.createDefaultSubmitButton() : payload],
    };
  }
}

const dxWiringService = new DxWiringService(inputDefsByKeyService, sensibleDefaults);
export default dxWiringService;
