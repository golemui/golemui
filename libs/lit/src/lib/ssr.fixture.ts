import type {
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  StandardSchemaV1,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import { InputWidgetAdapter } from './adapters/input-widget.adapter';
import { LayoutWidgetAdapter } from './adapters/layout-widget.adapter';
import { formContext, type LitFormContext } from './context/form.context';
import { safeDefine } from './utils/define';
import type { Type } from './utils/type';
import './components/form/form.element';

/**
 * Stub widget elements and a form definition shared by the server render and the
 * resume specs. The stubs use the real adapters and the real form context, so a value
 * that appears in the markup was read from the store through the same code path the
 * gui widget set uses.
 */

class StubTextInputElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  adapter = new InputWidgetAdapter<string, { placeholder?: string }>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`<input
      type="text"
      id=${this.widget.uid}
      data-label=${this.adapter.templateData.label ?? ''}
      .value=${this.adapter.templateData.value ?? ''}
    />`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}

class StubFlexElement extends LitElement implements WithWidget {
  widget!: LayoutWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  adapter = new LayoutWidgetAdapter();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const children = (this.adapter.templateData.children ?? []) as NonFunctionWidget<string>[];
    return html`<div class="stub-flex" id=${this.widget.uid}>
      ${children.map((child) => html`<gui-widget .widget=${child}></gui-widget>`)}
    </div>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}

safeDefine('gui-stub-input', StubTextInputElement);
safeDefine('gui-stub-flex', StubFlexElement);

export const stubWidgetLoaders = {
  textinput: async (): Promise<Type<WithWidget>> => StubTextInputElement as Type<WithWidget>,
  flex: async (): Promise<Type<WithWidget>> => StubFlexElement as Type<WithWidget>,
};

/** Accepts everything. The specs assert on markup, not on validation. */
export const noopValidators: ValidatorFn<any> = () =>
  ({
    '~standard': {
      version: 1,
      vendor: 'golemui-ssr-fixture',
      validate: (value: unknown) => ({ value }),
    },
  }) as StandardSchemaV1;

export const formDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [
      { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
      { kind: 'input', type: 'textinput', path: 'lastName', label: 'Last name' },
    ],
  },
};

export const formData = { firstName: 'Ada', lastName: 'Lovelace' };

export function buildConfig(): FormInitConfig<Type<WithWidget>> {
  return {
    formName: 'fixture-form',
    formDef,
    widgetLoaders: stubWidgetLoaders as any,
    data: formData,
  };
}

/**
 * The exact output of renderGuiFormHtml for buildConfig() plus noopValidators.
 * The server render spec asserts equality with this string byte for byte, and the
 * resume spec loads it into the DOM, so the two specs always test the same markup.
 */
export const canonicalServerMarkup = `<gui-core-form
      
      
      
     class="gui-form" defer-hydration>
  
  
      <form
        id="fixture-form"
        novalidate
        dir="ltr"
        
        
      >
         <gui-widget  style="display:contents" defer-hydration><gui-stub-flex   id="host-root" defer-hydration><div class="stub-flex" id="root">
      <gui-widget  style="display:contents" defer-hydration><gui-stub-input   id="host-firstName-textinput" defer-hydration><input
      type="text"
      id="firstName-textinput"
      data-label="First name"
      value="Ada"
    /></gui-stub-input></gui-widget><gui-widget  style="display:contents" defer-hydration><gui-stub-input   id="host-lastName-textinput" defer-hydration><input
      type="text"
      id="lastName-textinput"
      data-label="Last name"
      value="Lovelace"
    /></gui-stub-input></gui-widget>
    </div></gui-stub-flex></gui-widget>
      </form>
    
</gui-core-form>`;
