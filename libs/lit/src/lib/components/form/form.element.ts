import * as Core from '@golemui/core';
import { FormInitConfig, WidgetLoaders, WithWidget } from '@golemui/core';
import { provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { Subscription } from 'rxjs';
import { formContext, LitFormContext } from '../../context/form.context';
import '../widget/widget-element';

@customElement('gui-core-form')
export class FormElement extends LitElement {
  @provide({ context: formContext })
  context = new LitFormContext();

  @property({ attribute: false }) config!: FormInitConfig<WithWidget>;
  @property({ attribute: false }) validators!: Core.ValidatorFn<any>;
  @property({ type: String }) autocomplete: string | undefined = undefined;

  @state() direction: 'ltr' | 'rtl' = 'ltr';

  // Tracks the current form state for rendering. Not a @state() to avoid
  // re-rendering on every store emission - we call requestUpdate() explicitly
  // only when needed (on store subscription setup).
  private formState: Core.State | undefined;

  // Subscriptions replaced on each config change (store is recreated on init).
  private stateSub: Subscription | undefined;
  private healthSub: Subscription | undefined;
  // Subscriptions stable for the element lifetime.
  private eventSub: Subscription | undefined;
  private unsubscribeI18n: () => void = () => undefined;
  private readonly _defaultFormName = Core.shortUUID();

  static FORM_HEALTH_EVENT = 'formHealth';
  static FORM_EVENT = 'formEvent';

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-form');
    // events$ is a stable Subject - subscribe once for the element lifetime.
    this.eventSub = this.context.events$.subscribe((event) =>
      this.dispatchEvent(
        new CustomEvent<Core.FormEvent>(FormElement.FORM_EVENT, { detail: event, bubbles: true }),
      ),
    );
  }

  override updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('config') && this.config) {
      this._reinitialize(this.config);
    }
  }

  private _reinitialize(c: FormInitConfig<WithWidget>) {
    // Tear down subscriptions tied to the previous store instance.
    this.unsubscribeI18n();
    this.stateSub?.unsubscribe();
    this.healthSub?.unsubscribe();

    this.context.initialize(
      c.widgetLoaders as WidgetLoaders<WithWidget>,
      c.middlewares ?? [],
      this.validators,
      c.validateOn ?? 'eager',
      c.itemRenderers ?? {},
      c.localization,
      c.dependencies ?? {},
    );

    this.direction = Core.getDirectionFromLanguage(this.context.localization.lang);

    this.stateSub = this.context.store.state$.subscribe((s) => {
      this.formState = s;
      this.requestUpdate();
    });

    this.healthSub = Core.formHealth(this.context.store.state$).subscribe((health) => {
      this.dispatchEvent(
        new CustomEvent<Core.FormHealth>(FormElement.FORM_HEALTH_EVENT, {
          detail: health,
          bubbles: true,
        }),
      );
    });

    this.context.store.dispatch({
      type: 'INITIALIZE',
      payload: { formName: c.formName ?? this._defaultFormName, formDef: c.formDef },
    });
    this.context.store.dispatch({ type: 'SET_DATA', payload: { data: c.data ?? {} } });
    this.context.store.dispatch({ type: 'SET_META', payload: { meta: c.meta ?? {} } });

    this.unsubscribeI18n = this.context.localization.subscribe((lang) => {
      this.direction = Core.getDirectionFromLanguage(lang);
      this.context.store.dispatch({ type: 'SET_LANGUAGE', payload: { lang } });
    });
  }

  override createRenderRoot() {
    return this;
  }

  override render() {
    const ready = this.formState?.formDef && this.context.widgetRegistry.ready;
    const formName = this.config?.formName ?? this._defaultFormName;

    return html`
      <form
        id=${formName}
        novalidate
        dir=${this.direction}
        autocomplete=${this.autocomplete || nothing}
      >
        ${when(
          ready,
          () => html` <gui-widget .widget=${this.formState?.formDef.form}></gui-widget>`,
          () => html` <div>Loading form...</div>`,
        )}
      </form>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stateSub?.unsubscribe();
    this.healthSub?.unsubscribe();
    this.eventSub?.unsubscribe();
    this.unsubscribeI18n();
  }
}
