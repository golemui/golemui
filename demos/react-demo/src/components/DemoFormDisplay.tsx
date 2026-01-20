import * as React from '@golemui/react';
import { FormDefFacade } from '../services/formDef/formDef.domain';
import { FormConfig } from '../services/formDef/fomConfig.domain';
import { FormDisplayLayout } from './FormDisplayLayout';

interface DemoFormDisplayProps<T extends Record<string, any>> {
  title: string;
  description: string;
  formDef?: FormDefFacade<T>;
  formData?: T;
  warnings?: string[];
  formKey?: string;
  showingSingleForm?: boolean;
  formConfig?: FormConfig<T>;
}

export function DemoFormDisplay<T extends Record<string, any>>({
  title,
  description,
  formDef,
  formData,
  warnings,
  formKey,
  showingSingleForm = false,
  formConfig,
}: DemoFormDisplayProps<T>) {
  return (
    <FormDisplayLayout<T>
      title={title}
      description={description}
      formDef={formDef}
      formData={formData}
      warnings={warnings}
      formKey={formKey}
      showingSingleForm={showingSingleForm}
      formConfig={formConfig}
    />
  );
}

export default DemoFormDisplay;
