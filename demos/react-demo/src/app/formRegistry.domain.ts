import { type DxDefinitions, type GslSelectorsInput, type DxFormConfig } from '@golemui/gui-shared';
import { type DemoLogFn } from '../utils/demoLog';

export interface FormDemoDefinition<T extends Record<string, any> = any> {
  title: string;
  description: string;
  category?: string;
  formDef: DxDefinitions | ((log: DemoLogFn) => DxDefinitions);
  formDefSource?: string;
  formData?: T;
  warnings?: string[];
  formSelectors?: () => GslSelectorsInput;
  formConfig?: () => DxFormConfig;
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

  getByCategory(): { category: string; entries: FormRegistryEntry[] }[] {
    const categoryMap = new Map<string, FormRegistryEntry[]>();
    const categoryOrder: string[] = [];
    for (const form of this.forms) {
      const cat = form.category ?? 'Uncategorized';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
        categoryOrder.push(cat);
      }
      categoryMap.get(cat)!.push(form);
    }
    return categoryOrder.map((category) => ({
      category,
      entries: categoryMap.get(category)!,
    }));
  }

  getAllKeys(): string[] {
    return this.forms.map((form) => form.key);
  }
}

export const formRegistry = new FormRegistry();
export default formRegistry;
