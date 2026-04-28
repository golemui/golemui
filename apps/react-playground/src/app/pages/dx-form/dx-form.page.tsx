import * as AppsShared from '@golemui/apps-shared';
import { FormComponent } from '@golemui/gui-react';
import snarkdown from 'snarkdown';

const ks = AppsShared.buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () =>
      (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
  },
  dependencies: {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  },
});

export function DxFormPage() {
  return (
    <div>
      <FormComponent
        formDef={ks.formDef}
        data={ks.data}
        formSelectors={ks.formSelectors}
        formConfig={ks.formConfig}
      />
    </div>
  );
}

export default DxFormPage;
