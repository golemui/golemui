import { DxFieldsByKey, ProcessedDxFieldsByKey } from './guiFields.impl';
import inputDefsByKeyService, { InputDefsByKeyService } from '../config/helpers/inputDefsByKey.service';

export class GuiFieldsService {
  constructor(
    private readonly inputDefsByKeyService: InputDefsByKeyService,
  ) {}

  expand<T extends Record<string, unknown>>(fields: DxFieldsByKey<T>): ProcessedDxFieldsByKey<T> {
    return this.inputDefsByKeyService.expandFields(fields);
  }
}

const guiFieldsService = new GuiFieldsService(inputDefsByKeyService);
export { guiFieldsService };
