import * as React from '@golemui/react';
import { FormDefFacade } from '../services/formDef/formDef.domain';
import { FormDisplayLayout } from './FormDisplayLayout';

interface DemoFormDisplayProps<T extends Record<string, any>> {
  title: string;
  description: string;
  formDef?: FormDefFacade<T>;
  formData?: T;
  warnings?: string[];
  formKey?: string;
  showingSingleForm?: boolean;
}

export function DemoFormDisplay<T extends Record<string, any>>({
  title,
  description,
  formDef,
  formData,
  warnings,
  formKey,
  showingSingleForm = false,
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
    />
  );
}

export default DemoFormDisplay;
