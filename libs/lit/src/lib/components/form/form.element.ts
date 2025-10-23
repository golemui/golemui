import * as Core from '@formforge/core';
import { FieldLoaders, State, WithField } from '@formforge/core';
import { provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { Subscription } from 'rxjs';
import { formContext, LitFormContext } from '../../context/form.context';
import '../field/field.element';

@customElement('ff-form')
export class FormElement extends LitElement {
  @provide({ context: formContext })
  context = new LitFormContext();

  @property({ type: Object }) formDef: any = {};
  @property({ type: Array }) fieldLoaders!: FieldLoaders<WithField>;
  @property({ type: Array }) middlewares: any[] = [];
  @property({ type: Object }) data: any = {};
  @property({ type: String }) formName = Core.shortUUID();

  state: State | undefined;
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
        this.dispatchEvent(new CustomEvent(FormElement.FORM_ERROR_EVENT, { detail: error })),
      ),
      this.context.events$.subscribe((event) =>
        this.dispatchEvent(new CustomEvent(FormElement.FORM_EVENT, { detail: event })),
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
          () => html`<ff-field .field=${this.state!.formDef.form}></ff-field>`,
          () => html`<div>Loading form...</div>`,
        )}
      </form>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
