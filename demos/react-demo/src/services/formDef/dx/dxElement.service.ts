import { ValidDxElement } from '../formDef.domain';
import {
  DxShortcutDescriptor,
  DxShortcutType,
  LayoutDxShortcut,
  ParsedDxShortcut,
  UnrollingResult,
  ValidShortcutNames,
} from './dx.domain';
import { REGISTERED_DX_SHORTCUTS } from './config/dxRouting.config';
import dxUnrollingService, { DxUnrollingService } from './dxUnrolling.service';

export class DxElementService {
  constructor(private readonly dxUnrollingService: DxUnrollingService) {}

  assertIsValidDXElementAndUnroll<FORM_DATA extends Record<string, any> = any>(
    element: ValidDxElement<FORM_DATA>,
  ): UnrollingResult<FORM_DATA> {
    const parsed = this.parseElement(element);
    if (!parsed) {
      throw new Error(`Unexpected DX element ${JSON.stringify(element)}`);
    }

    if (parsed.descriptor.produces === 'layout') {
      return parsed as LayoutDxShortcut<FORM_DATA>;
    }

    return this.dxUnrollingService.unroll(parsed as ParsedDxShortcut<ValidDxElement<FORM_DATA>>);
  }

  private parseElement<FORM_DATA extends Record<string, any> = any>(
    element: ValidDxElement<FORM_DATA>,
  ): ParsedDxShortcut<ValidDxElement<FORM_DATA>> | null {
    // Handle plain object (data inputs by key)
    if (element != null && !Array.isArray(element) && typeof element === 'object') {
      const shortcut: ValidShortcutNames = '_inputDefsByKey';
      const descriptor = REGISTERED_DX_SHORTCUTS[shortcut];
      if (descriptor?.allows?.includes('object')) {
        return {
          descriptor,
          actualType: 'object',
          shortcut,
          payload: element,
          tags: [],
        };
      }
    }

    // Handle string shortcuts
    if (typeof element === 'string') {
      const descriptor = REGISTERED_DX_SHORTCUTS[element as ValidShortcutNames];
      if (descriptor?.allows?.includes('empty')) {
        return {
          descriptor,
          actualType: 'empty',
          shortcut: element as ValidShortcutNames,
          payload: element,
          tags: [],
        };
      }
    }

    // Handle array shortcuts [name, ...rest]
    if (Array.isArray(element) && element.length >= 1 && typeof element[0] === 'string') {
      const shortcut = element[0] as ValidShortcutNames;
      const descriptor = REGISTERED_DX_SHORTCUTS[shortcut];
      if (!descriptor) return null;

      // Check for array type (layout with children)
      if (descriptor.allows?.includes('array')) {
        return {
          descriptor,
          actualType: 'array',
          shortcut,
          payload: element,
          tags: [],
        };
      }

      // Check for tuple [name, config] where config can be object or callback
      if (element.length >= 2) {
        const config = element[1];
        const actualType = this.determineConfigType(descriptor, config);
        if (actualType) {
          return {
            descriptor,
            actualType,
            shortcut,
            payload: element,
            tags: [],
          };
        }
      }
    }

    return null;
  }

  private determineConfigType(
    descriptor: DxShortcutDescriptor,
    config: unknown,
  ): DxShortcutType | null {
    if (!descriptor.allows) return null;

    if (descriptor.allows.includes('callback') && typeof config === 'function') {
      return 'callback';
    }

    if (
      descriptor.allows.includes('object') &&
      config != null &&
      typeof config === 'object' &&
      !Array.isArray(config)
    ) {
      return 'object';
    }

    return null;
  }

  isLayout<FORM_DATA extends Record<string, any> = any>(
    element: UnrollingResult<FORM_DATA>,
  ): element is LayoutDxShortcut<FORM_DATA> {
    return 'descriptor' in element && element.descriptor.produces === 'layout';
  }
}

const dxElementService = new DxElementService(dxUnrollingService);
export default dxElementService;
