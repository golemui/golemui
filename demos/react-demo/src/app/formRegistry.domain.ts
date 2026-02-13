import { DxSelectors } from '../services/dx/dxSelectors.domain';
import { DxDefinitions } from '../services/dx/formDef.domain';

export interface FormDemoDefinition<T extends Record<string, any> = any> {
  title: string;
  description: string;
  formDef: DxDefinitions | (() => DxDefinitions);
  formData?: T;
  warnings?: string[];
  formConfig?: DxSelectors<T>;
  formConfig2?: any;
}

export type FormRegistryEntry<T extends Record<string, any> = any> = FormDemoDefinition<T> & {
  key: string;
};

class FormRegistry {
  private forms: FormRegistryEntry[] = [];

  registerAll<T extends Record<string, any>>(demos: FormDemoDefinition<T>[]): void {
    this.forms = demos.map((demo, index) => ({
      key: `demo-${index}`,
      ...demo,
    }));
  }

  get<T extends Record<string, any> = any>(key: string): FormRegistryEntry<T> | undefined {
    return this.forms.find((form) => form.key === key) as FormRegistryEntry<T> | undefined;
  }

  getAll(): FormRegistryEntry[] {
    return this.forms;
  }

  getAllKeys(): string[] {
    return this.forms.map((form) => form.key);
  }
}

export const formRegistry = new FormRegistry();
export default formRegistry;
