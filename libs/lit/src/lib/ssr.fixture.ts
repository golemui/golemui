import type {
  ActionWidget,
  DisplayWidget,
  FormInitConfig,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import { ActionWidgetAdapter } from './adapters/action-widget.adapter';
import { type BaseWidgetAdapter } from './adapters/base-widget.adapter';
import { DisplayWidgetAdapter } from './adapters/display.widget-adapter';
import { InputWidgetAdapter } from './adapters/input-widget.adapter';
import { LayoutWidgetAdapter } from './adapters/layout-widget.adapter';
import { formContext, type LitFormContext } from './context/form.context';
import { safeDefine } from '@golemui/lit-utils';
import type { Type } from './utils/type';
import './components/form/form.element';

/**
 * Stub widget elements and a form definition shared by the server render, the resume and the
 * adapter specs. The stubs use the real adapters and the real form context, so a value
 * that appears in the markup was read from the store through the same code path the
 * gui widget set uses.
 */

/** The adapter of the stub textinput and repeater widgets. */
export type InputAdapter<T = unknown> = InputWidgetAdapter<T, Record<string, any>>;
/** The adapter of the stub button widget. */
export type ActionAdapter = ActionWidgetAdapter<Record<string, any>>;
/** The adapter of the stub flex widget and of repeater rows. */
export type LayoutAdapter = LayoutWidgetAdapter<Record<string, any>>;
/** The adapter of the stub text widget. */
export type DisplayAdapter = DisplayWidgetAdapter<Record<string, any>>;

/** One stub widget connected: the widget uid and its adapter. */
export type AdapterRecord = { uid: string; adapter: unknown };

/**
 * One record per connection of a stub widget, in connection order. A DOM move connects an
 * element again and adds a record. Clear it between specs.
 */
export const recordedAdapters: AdapterRecord[] = [];

/**
 * @param uid - The uid of the widget, with row indexes inside a repeater row.
 * @returns The adapter of the last widget connected with that uid. Its templateData property
 * holds the current values.
 */
export function lastAdapter<Adapter>(uid: string): Adapter {
  for (let index = recordedAdapters.length - 1; index >= 0; index--) {
    if (recordedAdapters[index].uid === uid) {
      return recordedAdapters[index].adapter as Adapter;
    }
  }
  throw new Error(`No widget with the uid "${uid}" was connected`);
}

/**
 * Lit renders on the microtask schedule, so waiting one macrotask completes every nested
 * render.
 */
export const afterLitRenderSchedule = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Starts the adapter of a stub widget when the element connects, records it in
 * `recordedAdapters`, and renders again on every templateData change.
 */
abstract class StubWidgetElement<Widget extends NonFunctionWidget>
  extends LitElement
  implements WithWidget
{
  widget!: Widget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  abstract adapter: BaseWidgetAdapter<Widget> & { init(widget: Widget): void };

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    recordedAdapters.push({ uid: this.widget.uid, adapter: this.adapter });
    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }
}

class StubTextInputElement extends StubWidgetElement<InputWidget<string>> {
  adapter = new InputWidgetAdapter<string, { placeholder?: string }>();

  override render() {
    return html`<input
      type="text"
      id=${this.widget.uid}
      data-label=${this.adapter.templateData.label ?? ''}
      .value=${this.adapter.templateData.value ?? ''}
    />`;
  }
}

class StubFlexElement extends StubWidgetElement<LayoutWidget> {
  adapter = new LayoutWidgetAdapter();

  override render() {
    const children = (this.adapter.templateData.children ?? []) as NonFunctionWidget<string>[];
    return html`<div class="stub-flex" id=${this.widget.uid}>
      ${children.map((child) => html`<gui-widget .widget=${child}></gui-widget>`)}
    </div>`;
  }
}

/** Renders one row layout per row of its array value. */
class StubRepeaterElement extends StubWidgetElement<InputWidget<unknown[]>> {
  adapter = new InputWidgetAdapter<unknown[], Record<string, any>>();

  override render() {
    const rows = (this.adapter.templateData.rows ?? []) as NonFunctionWidget<string>[];
    return html`<div class="stub-repeater" id=${this.widget.uid}>
      ${rows.map((row) => html`<gui-widget .widget=${row}></gui-widget>`)}
    </div>`;
  }
}

/** A plain button, so a click never submits the form. */
class StubButtonElement extends StubWidgetElement<ActionWidget> {
  adapter = new ActionWidgetAdapter<Record<string, any>>();

  override render() {
    return html`<button type="button" id=${this.widget.uid}>
      ${this.adapter.templateData.label}
    </button>`;
  }
}

class StubTextElement extends StubWidgetElement<DisplayWidget> {
  adapter = new DisplayWidgetAdapter<Record<string, any>>();

  override render() {
    return html`<p id=${this.widget.uid}>${this.adapter.templateData['text']}</p>`;
  }
}

safeDefine('gui-stub-input', StubTextInputElement);
safeDefine('gui-stub-flex', StubFlexElement);
safeDefine('gui-stub-repeater', StubRepeaterElement);
safeDefine('gui-stub-button', StubButtonElement);
safeDefine('gui-stub-text', StubTextElement);

export const stubWidgetLoaders = {
  textinput: async (): Promise<Type<WithWidget>> => StubTextInputElement as Type<WithWidget>,
  flex: async (): Promise<Type<WithWidget>> => StubFlexElement as Type<WithWidget>,
  repeater: async (): Promise<Type<WithWidget>> => StubRepeaterElement as Type<WithWidget>,
  button: async (): Promise<Type<WithWidget>> => StubButtonElement as Type<WithWidget>,
  text: async (): Promise<Type<WithWidget>> => StubTextElement as Type<WithWidget>,
};

/**
 * The smallest widget set the contract allows: the reserved `grid` and `repeater` loaders and
 * one input. Core wraps an array-shaped form in a `grid` root, so this set must render one.
 */
export const reservedOnlyWidgetLoaders = {
  grid: async (): Promise<Type<WithWidget>> => StubFlexElement as Type<WithWidget>,
  repeater: async (): Promise<Type<WithWidget>> => StubFlexElement as Type<WithWidget>,
  textinput: async (): Promise<Type<WithWidget>> => StubTextInputElement as Type<WithWidget>,
};

/** Accepts everything. The specs assert on markup, not on validation. */
export const noopValidators: ValidatorFn<any> = () =>
  ({
    '~standard': {
      version: 1,
      vendor: 'golemui-ssr-fixture',
      validate: (value: unknown) => ({ value }),
    },
  }) as ReturnType<ValidatorFn<any>>;

export const formDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [
      // The `load` handler lets the specs pin down when the event fires: never on the server,
      // once the client has resumed.
      {
        kind: 'input',
        type: 'textinput',
        path: 'firstName',
        label: 'First name',
        on: { load: 'stubLoaded' },
      },
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
 * The exact output of renderForm for buildConfig() plus noopValidators.
 * The server render spec asserts equality with this string byte for byte, and the
 * resume spec loads it into the DOM, so the two specs always test the same markup.
 */
export const canonicalServerMarkup = `<gui-core-form
      
      
      
     class="gui-form" data-golemui-ssr defer-hydration>
  
  
      <form
        id="fixture-form"
        novalidate
        dir="ltr"
        
        
      >
         <gui-widget  style="display:contents" data-golemui-ssr defer-hydration><gui-stub-flex   id="host-root" data-golemui-ssr defer-hydration><div class="stub-flex" id="root">
      <gui-widget  style="display:contents" data-golemui-ssr defer-hydration><gui-stub-input   id="host-firstName-textinput" data-golemui-ssr defer-hydration><input
      type="text"
      id="firstName-textinput"
      data-label="First name"
      value="Ada"
    /></gui-stub-input></gui-widget><gui-widget  style="display:contents" data-golemui-ssr defer-hydration><gui-stub-input   id="host-lastName-textinput" data-golemui-ssr defer-hydration><input
      type="text"
      id="lastName-textinput"
      data-label="Last name"
      value="Lovelace"
    /></gui-stub-input></gui-widget>
    </div></gui-stub-flex></gui-widget>
      </form>
    
</gui-core-form>`;
