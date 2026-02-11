import {
  DxShortcutDescriptor,
  LayoutDxShortcutDescriptor,
  ParsedDxShortcut,
  SUBMIT_BUTTON_SHORTCUT,
  ValidShortcutNames,
} from '../dx.domain';
import { ActionDecorator } from '../../formDef.domain';
import { DxFieldsByKey, ReadyToMapField } from '../gui/guiFields.impl';

export const REGISTERED_DX_SHORTCUTS: Record<ValidShortcutNames, DxShortcutDescriptor> = {
  _inputDefsByKey: {
    allows: ['object', 'standard'],
    produces: 'fields',
    wiring: (dxWiringService, source: ParsedDxShortcut<DxFieldsByKey<any> | ReadyToMapField[]>) => {
      if (source.actualType === 'standard') {
        return dxWiringService.wireReadyToMapField(
          source.payload as ReadyToMapField[],
          source as ParsedDxShortcut<ReadyToMapField[]>,
        );
      }
      return dxWiringService.wireInputDefsByKey(source.payload as DxFieldsByKey<any>, source as ParsedDxShortcut<DxFieldsByKey<any>>);
    },
  },
  _horizontalLayout: {
    allows: ['array'],
    produces: 'layout',
    orientation: 'horizontal',
    wiring: (dxWiringService) => {
      throw new Error('Not implemented');
    },
  } as LayoutDxShortcutDescriptor,
  _submitButton: {
    allows: ['empty', 'object', 'callback'],
    produces: 'controllers',
    wiring: (
      dxWiringService,
      source: ParsedDxShortcut<SUBMIT_BUTTON_SHORTCUT | ActionDecorator | (() => ActionDecorator)>,
    ) => {
      return dxWiringService.wireSubmitButton(source.payload, source);
    },
  },
  _button: {
    allows: ['object', 'callback'],
    produces: 'controllers',
    wiring: (dxWiringService, source: ParsedDxShortcut<ActionDecorator | (() => ActionDecorator)>) => {
      return dxWiringService.wireButton(source.payload, source);
    },
  },
} as const;
