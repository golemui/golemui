import '../field/field.element';
import * as Core from '@formforge/core';
import { customElement, property } from 'lit/decorators.js';
import { LitElement, html } from 'lit';
import { Subscription } from 'rxjs';
import { State } from '@formforge/core';

@customElement('ff-form')
export class FormElement extends LitElement {
  @property({ type: Object }) formDef = {};
  @property({ type: Array }) fieldLoaders = {};
  @property({ type: Array }) middlewares = [];
  @property({ type: Object }) data = {};
  @property({ type: String }) formName = crypto.randomUUID();

  state: State | undefined;
  context: Core.FormContext<Core.WithField> =
    new Core.FormContext<Core.WithField>();

  subscriptions: Subscription[] = [];

  static FORM_ERROR_EVENT = 'ff-form-error-event';
  static FORM_EVENT = 'ff-form-event';

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-form');
    this.context.initialize(this.fieldLoaders, this.middlewares);

    this.subscriptions.push(
      this.context.store.state$.subscribe((s) => (this.state = s)),
      Core.formErrors(this.context.store.state$).subscribe((error) =>
        this.dispatchEvent(
          new CustomEvent(FormElement.FORM_ERROR_EVENT, { detail: error }),
        ),
      ),
      this.context.events$.subscribe((event) =>
        this.dispatchEvent(
          new CustomEvent(FormElement.FORM_EVENT, { detail: event }),
        ),
      ),
    );

    this.context.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: this.formName,
        formDef: this.formDef,
      },
    });

    this.context.store.dispatch({
      type: 'SET_DATA',
      payload: {
        data: this.data,
      },
    });
  }

  override render() {
    super.render();

    if (this.state?.formDef && this.context.fieldRegistry.ready) {
      return html`
        <form id=${this.formName}>
          <ff-field
            .field=${this.state.formDef.form}
            .formContext=${this.context}
          ></ff-field>
        </form>
      `;
    } else {
      return html`<div>Loading form...</div>`;
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
