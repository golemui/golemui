import { FormComponent } from '@golemui/react';
import { vanillaFieldLoaders } from '@golemui/react-vanilla';

export default function MyGolemForm(formDef: any, data: any) {
  return <FormComponent formDef={formDef} data={data} fieldLoader={{ ...vanillaFieldLoaders }} />;
}
