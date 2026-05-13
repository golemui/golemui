import * as AppsShared from '@golemui/apps-shared';
import { GuiForm } from '@golemui/gui-react';

const md = AppsShared.modularDx;

export function ModularDxPage() {
  return (
    <div>
      <GuiForm
        formDef={md.formDef}
        data={md.data}
        formSelectors={md.formSelectors}
        formConfig={md.formConfig}
        formEvent={AppsShared.onFormEvent}
      />
    </div>
  );
}

export default ModularDxPage;
