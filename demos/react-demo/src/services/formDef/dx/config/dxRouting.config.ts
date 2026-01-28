import {
  DxShortcutDescriptor,
  LayoutDxShortcutDescriptor,
  ParsedDxShortcut,
  SUBMIT_BUTTON_SHORTCUT,
  ValidShortcutNames,
} from '../dx.domain';
import { ControllerDef, DataInputDefsByKey } from '../../formDef.domain';

export const REGISTERED_DX_SHORTCUTS: Record<ValidShortcutNames, DxShortcutDescriptor> = {
  _inputDefsByKey: {
    allows: ['object'],
    produces: 'fields',
    wiring: (dxWiringService, source: ParsedDxShortcut<DataInputDefsByKey<any>>) => {
      return dxWiringService.wireInputDefsByKey(source.payload, source);
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
      source: ParsedDxShortcut<SUBMIT_BUTTON_SHORTCUT | ControllerDef | (() => ControllerDef)>,
    ) => {
      return dxWiringService.wireSubmitButton(source.payload, source);
    },
  },
} as const;
