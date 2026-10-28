import {
  type FormEvent,
  type FormHealth,
  type FormInitConfig,
  type FormSubmitEvent,
  type State,
  type ValidatorFn,
  type WidgetLoaders,
  type WithWidget,
  formEventNames,
  formHealth,
  getDirectionFromLanguage,
  shortUUID,
} from '@golemui/core';
import { provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { when } from 'lit/directives/when.js';
import { type Subscription } from 'rxjs';
import { formContext, LitFormContext } from '../../context/form.context';
import { safeDefine } from '@golemui/lit-utils';
import { unsubscribeAll } from '../../utils/subscriptions';
import '../widget/widget-element';
import { defaultFormHealthBoundary, type FormHealthBoundary } from './form-health-boundary';

// The same comparison as the `formHealth` selector of core.
function isSameFormHealth(previous: FormHealth, current: FormHealth): boolean {
  if (previous.status !== current.status) {
    return false;
  }
  if (previous.status === 'errored' && current.status === 'errored') {
    return previous.message === current.message && previous.code === current.code;
  }
  return true;
}

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
  // A DOM move closes the store subscriptions in disconnectedCallback, and connectedCallback opens
  // them again on the same store.
  private storeInitialized = false;
  private storeSubscriptionsOpen = false;
  // Lit still updates a disconnected element, so a new config can arrive while it is detached.
  private detached = false;
  // A new subscription emits the current health first. After a DOM move, an unchanged health must
  // not log or dispatch again.
  private lastHealth: FormHealth | undefined;
  // Keys the widget tree. Every initialization bumps it, so the whole tree is destroyed
  // and recreated and every widget subscribes to the store INITIALIZE ran on.
  private storeGeneration = 0;
  // Subscriptions stable for the element lifetime.
  private eventSub: Subscription[] = [];
  private unsubscribeI18n: () => void = () => undefined;
  private readonly _defaultFormName = shortUUID();

  static FORM_SUBMIT_EVENT = formEventNames.submit;
  static FORM_HEALTH_EVENT = formEventNames.health;
  static FORM_EVENT = formEventNames.event;

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-form');
    this.configureLongLivedEvents();
    this.detached = false;
    if (this.storeInitialized && !this.storeSubscriptionsOpen) {
      this.subscribeToStore();
      this.subscribeToLanguage();
      // The language listener was closed while the element was detached.
      const lang = this.context.localization.lang;
      if (this.context.store.getState().lang !== lang) {
        this.applyLanguage(lang);
      }
    }
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

  // Runs before render (not in updated()) so a server render, which never reaches
  // updated(), computes the form in the same pass. On the client the first render
  // then shows the form instead of the loading fallback.
  override willUpdate(changed: Map<string, unknown>) {
    super.willUpdate(changed);
    if ((changed.has('config') || changed.has('validators')) && this.config) {
      this._reinitialize(this.config);
    }
  }

  private _reinitialize(c: FormInitConfig<WithWidget>) {
    // Tear down subscriptions tied to the previous store instance.
    this.closeStoreSubscriptions();
    this.storeGeneration += 1;

    this.context.initialize(
      c.widgetLoaders as WidgetLoaders<WithWidget>,
      c.middlewares ?? [],
      this.validators,
      c.validateOn ?? 'eager',
      c.itemRenderers ?? {},
      c.localization,
      c.dependencies ?? {},
      c.functions ?? {},
      c.expressionPolicy ?? 'warn',
    );
    this.storeInitialized = true;
    this.lastHealth = undefined;

    this.direction = getDirectionFromLanguage(this.context.localization.lang);

    // A detached element opens the subscriptions in connectedCallback.
    if (!this.detached) {
      this.subscribeToStore();
    }

    this.context.store.dispatch({
      type: 'INITIALIZE',
      payload: { formName: c.formName ?? this._defaultFormName, formDef: c.formDef },
    });
    this.context.store.dispatch({ type: 'SET_DATA', payload: { data: c.data ?? {} } });
    this.context.store.dispatch({ type: 'SET_META', payload: { meta: c.meta ?? {} } });

    if (this.detached) {
      // No state subscription is open, and the render of a detached update must use the new store.
      this.formState = this.context.store.getState();
    } else {
      this.subscribeToLanguage();
    }
  }

  private subscribeToStore() {
    this.stateSub = this.context.store.state$.subscribe((s) => {
      this.formState = s;
      this.requestUpdate();
    });

    this.healthSub = formHealth(this.context.store.state$).subscribe((health) => {
      if (this.lastHealth !== undefined && isSameFormHealth(this.lastHealth, health)) {
        return;
      }
      this.lastHealth = health;
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
    this.storeSubscriptionsOpen = true;
  }

  private subscribeToLanguage() {
    this.unsubscribeI18n = this.context.localization.subscribe((lang) => this.applyLanguage(lang));
  }

  private applyLanguage(lang: string) {
    this.direction = getDirectionFromLanguage(lang);
    this.context.store.dispatch({ type: 'SET_LANGUAGE', payload: { lang } });
  }

  private closeStoreSubscriptions() {
    this.unsubscribeI18n();
    this.stateSub?.unsubscribe();
    this.healthSub?.unsubscribe();
    this.storeSubscriptionsOpen = false;
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
          () =>
            keyed(
              this.storeGeneration,
              html` <gui-widget .widget=${this.formState?.formDef.form}></gui-widget>`,
            ),
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
    this.detached = true;
    this.closeStoreSubscriptions();
    // `connectedCallback` refills the array on a reconnect, so it must be emptied here.
    unsubscribeAll(this.eventSub);
  }
}

safeDefine('gui-core-form', FormElement);
