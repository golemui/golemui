import { ControllerDef, DataInputDefsByKey } from '../../formDef.domain';
import {
  ParsedDxShortcut,
  SUBMIT_BUTTON_SHORTCUT,
  UnrolledControllers,
  UnrolledFields,
} from '../dx.domain';
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
    payload: SUBMIT_BUTTON_SHORTCUT | ControllerDef | (() => ControllerDef),
    source: ParsedDxShortcut<SUBMIT_BUTTON_SHORTCUT | ControllerDef | (() => ControllerDef)>,
  ): UnrolledControllers {
    const baseValue = payload === '_submitButton' ? this.sensibleDefaults.createDefaultSubmitButton() : payload;
    return {
      type: 'controllers',
      source,
      items: [
        {
          type: 'controller',
          tags: [],
          value: baseValue,
        },
      ],
    };
  }
}

const dxWiringService = new DxWiringService(inputDefsByKeyService, sensibleDefaults);
export default dxWiringService;
