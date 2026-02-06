import { ActionDef } from '../../formDef.domain';
import {
  ParsedDxShortcut,
  SUBMIT_BUTTON_SHORTCUT,
  UnrolledControllers,
  UnrolledFields,
} from '../dx.domain';
import sensibleDefaults, { SensibleDefaults } from '../../default/sensibleDefaults.service';
import inputDefsByKeyService, { InputDefsByKeyService } from './helpers/inputDefsByKey.service';
import { DxFieldsByKey, ReadyToMapField } from '../gui/guiFields.impl';

export class DxWiringService {
  constructor(
    private readonly inputDefsByKeyService: InputDefsByKeyService,
    private readonly sensibleDefaults: SensibleDefaults,
  ) {}

  wireInputDefsByKey<T extends Record<string, any>>(
    inputDefsByKey: DxFieldsByKey<T>,
    source: ParsedDxShortcut<DxFieldsByKey<T>>,
  ): UnrolledFields {
    return this.inputDefsByKeyService.unroll(inputDefsByKey, source);
  }

  wireSubmitButton(
    payload: SUBMIT_BUTTON_SHORTCUT | ActionDef | (() => ActionDef),
    source: ParsedDxShortcut<SUBMIT_BUTTON_SHORTCUT | ActionDef | (() => ActionDef)>,
  ): UnrolledControllers {
    const baseValue =
      payload === '_submitButton' ? this.sensibleDefaults.createDefaultSubmitButton() : payload;
    return {
      type: 'controllers',
      source,
      items: [
        {
          type: 'controller',
          value: baseValue,
        },
      ],
    };
  }

  wireButton(
    payload: ActionDef | (() => ActionDef),
    source: ParsedDxShortcut<ActionDef | (() => ActionDef)>,
  ): UnrolledControllers {
    return {
      type: 'controllers',
      source,
      items: [
        {
          type: 'controller',
          value: payload,
        },
      ],
    };
  }

  wireReadyToMapField<T extends Record<string, any>>(
    payload: ReadyToMapField[],
    source: ParsedDxShortcut<ReadyToMapField[]>,
  ) {
    const inputDefsByKey: Partial<DxFieldsByKey<T>> = {};

    for (const field of payload) {
      inputDefsByKey[field.key as keyof T] = field.processedField;
    }

    return this.wireInputDefsByKey(
      inputDefsByKey as DxFieldsByKey<T>,
      source as ParsedDxShortcut<DxFieldsByKey<T>>,
    );
  }
}

const dxWiringService = new DxWiringService(inputDefsByKeyService, sensibleDefaults);
export default dxWiringService;
