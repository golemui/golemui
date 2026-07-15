import type { TimeInputProps } from '@golemui/gui-shared/internals';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { AbstractTimePartsInput } from './abstract-time-parts-input';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

@customElement('gui-time')
export class GuiTime extends AbstractTimePartsInput {
  @property({ type: String }) value: string | undefined = undefined;

  protected override readonly inputBlockClass = 'gui-time-input';
  protected override readonly groups = ['default'] as const;

  override willUpdate(changedProperties: PropertyValues): void {
    if (
      !this.hasUpdated ||
      changedProperties.has('value') ||
      changedProperties.has('hourFormat') ||
      changedProperties.has('localeId')
    ) {
      this.setGroupTime('default', this.value ?? '');
    }
  }

  override render() {
    const templateData: ControlTemplateData<string> & TimeInputProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      icon: this.icon,
      hint: this.hint,
    };

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: true,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData) : nothing}

      <div class="gui-widget">
        <div
          class="gui-widget-input gui-parts gui-parts-ring gui-time-input ${this.icon
            ? 'gui-calendar--icon'
            : ''}"
          role="group"
        >
          ${this.renderGroupParts('default')}
        </div>
        ${this.icon
          ? html`<span class=${classMap(iconClassMap)} data-icon=${this.icon}></span>`
          : nothing}
      </div>

      ${this.showErrors && this.errors?.length
        ? addErrors(this.uid as string, templateData)
        : nothing}
    `;
  }

  protected override commitParts(): void {
    this.validateAndEmit();
  }

  private validateAndEmit() {
    const parsed = this.parseTimeGroup('default');
    if (!parsed) {
      this.requestUpdate();
      return;
    }
    const { iso, boundsError } = parsed;

    if (boundsError) {
      this.dispatchEvent(
        new CustomEvent('change', { detail: { value: iso }, bubbles: true }),
      );
      this.dispatchEvent(
        new CustomEvent('inputError', { detail: { message: boundsError }, bubbles: true }),
      );
      this.requestUpdate();
      return;
    }

    this.value = iso;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true }),
    );
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-time': GuiTime;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-time')) {
  customElements.define('gui-time', GuiTime);
}
