import { FormDefFacade } from './formDef/formDef.domain';

export interface FormRegistryEntry<T extends Record<string, any> = any> {
  key: string;
  title: string;
  description: string;
  formDef: FormDefFacade<T>;
  formData?: T;
  warnings?: string[];
}

class FormRegistry {
  private forms = new Map<string, FormRegistryEntry>();

  register<T extends Record<string, any>>(entry: FormRegistryEntry<T>): void {
    this.forms.set(entry.key, entry);
  }

  get<T extends Record<string, any> = any>(key: string): FormRegistryEntry<T> | undefined {
    return this.forms.get(key) as FormRegistryEntry<T> | undefined;
  }

  getAll(): FormRegistryEntry[] {
    return Array.from(this.forms.values());
  }

  getAllKeys(): string[] {
    return Array.from(this.forms.keys());
  }
}

export const formRegistry = new FormRegistry();
export default formRegistry;
