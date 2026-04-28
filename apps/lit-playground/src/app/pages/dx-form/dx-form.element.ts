import * as AppsShared from '@golemui/apps-shared';
import '@golemui/gui-lit';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import snarkdown from 'snarkdown';

const ks = AppsShared.buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () =>
      (await import('../../custom-widgets/heading/heading.element')).HeadingElement,
  },
  dependencies: {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  },
});

@customElement('lit-dx-form')
export class DxFormElement extends LitElement {
  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <div>
        <gui-form
          .formDef=${ks.formDef}
          .data=${ks.data}
          .formSelectors=${ks.formSelectors}
          .formConfig=${ks.formConfig}
        ></gui-form>
      </div>
    `;
  }
}
