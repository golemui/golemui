import { modularDx, onFormEvent } from '@golemui/apps-shared';
import { GuiForm } from '@golemui/gui-react';

const md = modularDx;
const config = {
  formDef: md.formDef,
  data: md.data,
  formSelectors: md.formSelectors,
  formConfig: md.formConfig,
};

export function ModularDxPage() {
  return (
    <div>
      <GuiForm config={config} formEvent={onFormEvent} />
    </div>
  );
}

export default ModularDxPage;
