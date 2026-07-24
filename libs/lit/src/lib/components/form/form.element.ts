import {
  type FormEvent,
  type FormHealth,
  type FormInitConfig,
  type FormSubmitEvent,
  type State,
  type ValidatorFn,
  type WidgetLoaders,
  type WithWidget,
  formHealth,
  getDirectionFromLanguage,
  shortUUID,
} from '@golemui/core';
import { provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { type Subscription } from 'rxjs';
import { formContext, LitFormContext } from '../../context/form.context';
import '../widget/widget-element';
import { defaultFormHealthBoundary, type FormHealthBoundary } from './form-health-boundary';

@customElement('gui-core-form')
export class FormElement extends LitElement {
  @provide({ context: formContext })
  context = new LitFormContext();

  @property({ attribute: false }) config!: FormInitConfig<WithWidget>;
  @property({ attribute: false }) validators!: ValidatorFn<any>;
  @property({ type: String }) autocomplete: string | undefined = undefined;
  /** Wraps the form and renders the error UI for an errored {@link FormHealth}. Defaults to {@link defaultFormHealthBoundary} (a red banner). */
  @property({ attribute: false }) formHealthBoundary?: FormHealthBoundary;

  @state() direction: 'ltr' | 'rtl' = 'ltr';
  @state() health: FormHealth = { status: 'ok' };

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
      c.functions ?? {},
    );

    this.direction = getDirectionFromLanguage(this.context.localization.lang);

    this.stateSub = this.context.store.state$.subscribe((s) => {
      this.formState = s;
      this.requestUpdate();
    });

    this.healthSub = formHealth(this.context.store.state$).subscribe((health) => {
      this.health = health;
      if (health.status === 'errored') {
        console.error('GolemUI form failed to initialize:', health.message);
      }
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
    const ready = this.formState?.formDef && this.context.widgetRegistry.ready;
    const formName = this.config?.formName ?? this._defaultFormName;
    const isErrored = this.health.status === 'errored';

    // Always render the form inside the boundary so a recovered health clears the error in place.
    const form = html`
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
          () => (isErrored ? nothing : html` <div>Loading form...</div>`),
        )}
      </form>
    `;

    const boundary = this.formHealthBoundary ?? defaultFormHealthBoundary;
    return boundary({ health: this.health, form });
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
