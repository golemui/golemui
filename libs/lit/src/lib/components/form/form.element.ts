import * as Core from '@golemui/core';
import { FieldLoaders, State, WithField } from '@golemui/core';
import { provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { Subscription } from 'rxjs';
import { formContext, LitFormContext } from '../../context/form.context';
import '../field/field.element';

@customElement('gui-form')
export class FormElement extends LitElement {
  @provide({ context: formContext })
  context = new LitFormContext();

  @property({ type: Object }) formDef: any = {};
  @property({ type: Array }) fieldLoaders!: FieldLoaders<WithField>;
  @property({ type: Array }) middlewares: any[] = [];
  @property({ type: Object }) customValidators: Core.CustomValidatorSchemas = {};
  @property({ type: Object }) data: any = {};
  @property({ type: String }) formName = Core.shortUUID();

  state: State | undefined;
  subscriptions: Subscription[] = [];

  static FORM_ERROR_EVENT = 'formError';
  static FORM_EVENT = 'event';

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-form');
    this.context.initialize(this.fieldLoaders, this.middlewares, this.customValidators);

    this.subscriptions.push(
      this.context.store.state$.subscribe((s) => (this.state = s)),
      Core.formErrors(this.context.store.state$).subscribe((error) => {
        this.dispatchEvent(
          new CustomEvent(FormElement.FORM_ERROR_EVENT, { detail: error, bubbles: true }),
        );
      }),
      this.context.events$.subscribe((event) =>
        this.dispatchEvent(
          new CustomEvent(FormElement.FORM_EVENT, { detail: event, bubbles: true }),
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
  }

  override createRenderRoot() {
    return this;
  }

  override render() {
    const ready = this.state?.formDef && this.context.fieldRegistry.ready;

    return html`
      <form id=${this.formName}>
        ${when(
          ready,
          () => html` <gui-field .field=${this.state!.formDef.form}></gui-field>`,
          () => html` <div>Loading form...</div>`,
        )}
      </form>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
