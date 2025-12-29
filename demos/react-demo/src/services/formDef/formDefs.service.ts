import formMapperService, { FormMapperService } from '../formMapper.service';
import formDefFacadeFactory, { FormDefFacadeFactory } from './formDefFacadeFactory.service';
import { Form, UiState } from '@golemui/core';
import { FormDefFacade } from './formDefFacade.domain';

export class FormDefFacadesService {
  constructor(
    private readonly formDefFacadeFactory: FormDefFacadeFactory,
    private readonly formMapperService: FormMapperService,
  ) {}

  processFacade<
    StateKeys extends UiState = never,
    FORM_DATA extends Record<string, any> = any,
  >(
    formDefRaw: FormDefFacade<FORM_DATA> | null,
    formDataRaw: FORM_DATA | null,
  ): Form<StateKeys, FORM_DATA> {
    const formDefFacade = this.formDefFacadeFactory.createFromRawFormDef<FORM_DATA>(
      formDefRaw,
      formDataRaw,
    );
    return this.formMapperService.map<StateKeys, FORM_DATA>(formDefFacade);
  }
}
const formDefFacades = new FormDefFacadesService(formDefFacadeFactory, formMapperService);
export default formDefFacades;
