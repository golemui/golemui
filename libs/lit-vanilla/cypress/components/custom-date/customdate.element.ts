import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-customdate')
export class CustomdateElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<string, Record<string, any>>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-customdate');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <div class="gui-field">
        <input
          type="text"
          id=${this.widget.uid}
          data-cy=${`${this.widget.uid}_customdate`}
          value=${this.adapter.templateData.value ?? ''}
          placeholder="dd-mm-yyyy"
          @input="${() => this.valueChanged(event)}"
          @blur="${() => this.adapter.onBlur()}"
        />
      </div>

      ${addErrors(this.widget.uid, this.adapter.templateData)}
    `;
  }

  valueChanged(event: Event | undefined) {
    const target = event?.target as HTMLInputElement;
    this.adapter.valueChanged(target.value);
    this.injectValidationIssues(target.value ?? '');
  }

  private injectValidationIssues(ddmmyyyy: string) {
    if (ddmmyyyy.length === 0) {
      this.adapter.injectValidationIssues(null);
      return;
    }

    // expected value format: dd-mm-yyyy
    const regEx = /^(\d{2})-(\d{2})-(\d{4})$/;
    const results = regEx.exec(ddmmyyyy);

    if (!results) {
      this.adapter.injectValidationIssues(['Invalid date format']);
      return;
    }

    const day = Number(results[1]); // 01 -> 31
    const month = Number(results[2]); // 01 -> 12
    const year = Number(results[3]);

    // basic range checks
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      this.adapter.injectValidationIssues(['Impossible date']);
      return;
    }

    // calendar-validity check
    const date = new Date(year, month - 1, day);
    const isValid =
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

    if (!isValid) {
      this.adapter.injectValidationIssues(['Invalid date']);
      return;
    }

    this.adapter.injectValidationIssues(null);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}

const addErrors = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: Core.ControlTemplateData<T> & ExtraProps,
) => {
  const showErrors = templateData.touched && templateData.errors && templateData.errors.length > 0;

  return html`${showErrors
    ? html`<ul class="gui-validator" id=${`${uid}_errors`} data-cy=${`${uid}_validator-errors`}>
        ${templateData.errors?.map(
          (error: any) =>
            html`<li class="gui-validator__error" role="status" data-cy=${`${uid}_validator-error`}>
              ${error}
            </li>`,
        )}
      </ul>`
    : ''}`;
};
