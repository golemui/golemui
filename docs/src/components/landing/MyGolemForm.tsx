import { vanillaFieldLoaders } from '@golemui/react-vanilla';
import { FormComponent } from '@golemui/react';

export default function MyGolemForm(formDef: any, data: any) {
  return <FormComponent formDef={formDef} data={data} fieldLoader={{ ...vanillaFieldLoaders }} />;
}
