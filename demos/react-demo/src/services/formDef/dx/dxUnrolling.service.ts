import {
  ParsedDxShortcut,
  UnrolledController,
  UnrolledField,
  UnrolledItems,
  UnrolledLayout,
  ValidUnrolledElement,
} from './dx.domain';
import { ValidDxElement } from '../formDef.domain';
import dxWiringService, { DxWiringService } from './config/dxWiring.service';

export class DxUnrollingService {
  constructor(
    private readonly dxWiringService: DxWiringService,
  ) {}

  isUnrolledLayout(element: ValidUnrolledElement): element is UnrolledLayout {
    return element.type === 'layout';
  }

  isUnrolledItems(element: ValidUnrolledElement): element is UnrolledItems {
    return element.type === 'fields' || element.type === 'controllers';
  }

  isUnrolledField(element: UnrolledField | UnrolledController): element is UnrolledField {
    return element.type === 'field';
  }

  unroll<FORM_DATA extends Record<string, any> = any>(
    result: ParsedDxShortcut<ValidDxElement<FORM_DATA>>,
  ): ValidUnrolledElement {
    return result.descriptor.wiring(this.dxWiringService, result)
  }
}

const dxUnrollingService = new DxUnrollingService(dxWiringService);
export default dxUnrollingService;
