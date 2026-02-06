import * as Core from '@golemui/core';
import { State, WidgetLoaders, WithWidget } from '@golemui/core';
import { provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { Subscription } from 'rxjs';
import { formContext, LitFormContext } from '../../context/form.context';
import '../widget/widget-element';
import { ValidateOnConverter } from './property.converters';

@customElement('gui-core-form')
export class FormElement extends LitElement {
  @provide({ context: formContext })
  context = new LitFormContext();

  @property({ type: Object }) formDef: any = {};
  @property({ type: Object }) widgetLoaders!: WidgetLoaders<WithWidget>;
  @property({ attribute: false }) validators!: Core.ValidatorFn<any>;
  @property({ type: Array }) middlewares: Core.Middleware<Core.State, Core.Action>[] = [];
  @property({ type: Object }) data: any = {};
  @property({ type: String }) formName = Core.shortUUID();
  @property({ converter: ValidateOnConverter }) validateOn: Core.ValidateOn = 'eager';
  @property({ type: Object }) itemRenderers: Record<string, Core.ItemRenderer> = {};
  @property({ type: Object }) localization?: Core.I18nTranslator;

  state: State | undefined;
  subscriptions: Subscription[] = [];
  private unsubscribeI18n: () => void = () => undefined;

  static FORM_HEALTH_EVENT = 'formHealth';
  static FORM_EVENT = 'formEvent';

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-form');
    this.context.initialize(
      this.widgetLoaders,
      this.middlewares,
      this.validators,
      this.validateOn,
      this.itemRenderers,
      this.localization,
    );

    this.subscriptions.push(
      this.context.store.state$.subscribe((s) => (this.state = s)),
      Core.formHealth(this.context.store.state$).subscribe((health) => {
        this.dispatchEvent(
          new CustomEvent<Core.FormHealth>(FormElement.FORM_HEALTH_EVENT, {
            detail: health,
            bubbles: true,
          }),
        );
      }),
      this.context.events$.subscribe((event) =>
        this.dispatchEvent(
          new CustomEvent<Core.FormEvent>(FormElement.FORM_EVENT, { detail: event, bubbles: true }),
        ),
      ),
    );

    this.context.store.dispatch({
      type: 'INITIALIZE',
      payload: { formName: this.formName, formDef: this.formDef },
    });

    this.context.store.dispatch({
      type: 'SET_DATA',
      payload: { data: this.data },
    });

    this.unsubscribeI18n = this.context.localization.subscribe((lang) => {
      this.context.store.dispatch({
        type: 'SET_LANGUAGE',
        payload: {
          lang,
        },
      });
    });
  }

  override createRenderRoot() {
    return this;
  }

  override render() {
    const ready = this.state?.formDef && this.context.widgetRegistry.ready;

    return html`
      <form id=${this.formName} novalidate>
        ${when(
          ready,
          () => html` <gui-widget .widget=${this.state?.formDef.form}></gui-widget>`,
          () => html` <div>Loading form...</div>`,
        )}
      </form>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.unsubscribeI18n();
  }
}
