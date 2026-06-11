import {
  type FormEvent,
  type FormHealth,
  type FormInitConfig,
  type FormSubmitEvent,
  type State,
  type ValidatorFn,
  formHealth,
  getDirectionFromLanguage,
  shortUUID,
} from '@golemui/core';
import type { WidgetLoaders, WithWidget } from '@golemui/core/internals';
import { provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { type Subscription } from 'rxjs';
import { formContext, LitFormContext } from '../../context/form.context';
import '../widget/widget-element';

@customElement('gui-core-form')
export class FormElement extends LitElement {
  @provide({ context: formContext })
  context = new LitFormContext();

  @property({ attribute: false }) config!: FormInitConfig<WithWidget>;
  @property({ attribute: false }) validators!: ValidatorFn<any>;
  @property({ type: String }) autocomplete: string | undefined = undefined;

  @state() direction: 'ltr' | 'rtl' = 'ltr';
  @state() healthError: string | null = null;

  // Tracks the current form state for rendering. Not a @state() to avoid
  // re-rendering on every store emission - we call requestUpdate() explicitly
  // only when needed (on store subscription setup).
  private formState: State | undefined;

  // Subscriptions replaced on each config change (store is recreated on init).
  private stateSub: Subscription | undefined;
  private healthSub: Subscription | undefined;
  // Subscriptions stable for the element lifetime.
  private eventSub: Subscription[] = [];
  private unsubscribeI18n: () => void = () => undefined;
  private readonly _defaultFormName = shortUUID();

  static FORM_SUBMIT_EVENT = 'formSubmit';
  static FORM_HEALTH_EVENT = 'formHealth';
  static FORM_EVENT = 'formEvent';

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-form');
    this.configureLongLivedEvents();
  }

  /**
   * Stable events subscriptions.
   * ( Stable events are those that survive store replacements )
   */
  private configureLongLivedEvents() {
    this.eventSub.push(
      this.context.events$.subscribe((event) =>
        this.dispatchEvent(
          new CustomEvent<FormEvent>(FormElement.FORM_EVENT, { detail: event, bubbles: true }),
        ),
      ),
    );

    this.eventSub.push(
      this.context.submit$.subscribe((event) =>
        this.dispatchEvent(
          new CustomEvent<FormSubmitEvent>(FormElement.FORM_SUBMIT_EVENT, {
            detail: event,
            bubbles: true,
          }),
        ),
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

    this.direction = getDirectionFromLanguage(this.context.localization.lang);

    this.stateSub = this.context.store.state$.subscribe((s) => {
      this.formState = s;
      this.requestUpdate();
    });

    this.healthSub = formHealth(this.context.store.state$).subscribe((health) => {
      const message = health.status === 'errored' ? health.message : null;
      this.healthError = message;
      if (message) console.error('GolemUI form failed to initialize:', message);
      this.dispatchEvent(
        new CustomEvent<FormHealth>(FormElement.FORM_HEALTH_EVENT, {
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
      this.direction = getDirectionFromLanguage(lang);
      this.context.store.dispatch({ type: 'SET_LANGUAGE', payload: { lang } });
    });
  }

  override createRenderRoot() {
    return this;
  }

  override render() {
    // A bad formDef errors formHealth and never produces a layout — surface it visibly
    // (same red-box pattern as WidgetErrorBoundary) instead of a stuck "Loading form...".
    if (this.healthError) {
      return html`<div role="alert" style="border: 2px solid red; border-radius: 4px; padding: 12px;">
        <strong style="color: red;">GolemUI form error</strong>
        <p style="margin-top: 4px;"><code>${this.healthError}</code></p>
      </div>`;
    }

    const ready = this.formState?.formDef && this.context.widgetRegistry.ready;
    const formName = this.config?.formName ?? this._defaultFormName;

    return html`
      <form
        id=${formName}
        novalidate
        dir=${this.direction}
        autocomplete=${this.autocomplete || nothing}
        @submit=${this.onFormSubmit}
      >
        ${when(
          ready,
          () => html` <gui-widget .widget=${this.formState?.formDef.form}></gui-widget>`,
          () => html` <div>Loading form...</div>`,
        )}
      </form>
    `;
  }

  private onFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.context.emitSubmitEvent();
  }

  setData(data: Record<string, any>): void {
    this.context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  }

  setMeta(meta: Record<string, any>): void {
    this.context.store.dispatch({ type: 'SET_META', payload: { meta } });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stateSub?.unsubscribe();
    this.healthSub?.unsubscribe();
    this.eventSub.map((sub) => sub.unsubscribe());
    this.unsubscribeI18n();
  }
}
