import type { DateTimeInputProps } from '@golemui/gui-shared/internals';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { AbstractDateTimePartsInput } from './abstract-date-time-parts-input';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

@customElement('gui-date-time')
export class GuiDateTime extends AbstractDateTimePartsInput {
  @property({ type: String }) value: string | undefined = undefined;

  protected override readonly inputBlockClass = 'gui-date-time-input';
  protected override readonly groups = ['default'] as const;

  override willUpdate(changedProperties: PropertyValues): void {
    // !hasUpdated: parse on first render even when no value was ever set,
    if (
      !this.hasUpdated ||
      changedProperties.has('value') ||
      changedProperties.has('hourFormat') ||
      changedProperties.has('localeId')
    ) {
      this.setGroupDateTime('default', this.value ?? '');
    }
  }

  override render() {
    const templateData: ControlTemplateData<string> & DateTimeInputProps = {
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
          class="gui-widget-input gui-parts gui-parts-ring gui-date-time-input ${this.icon
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
    const parsed = this.parseDateTimeGroup('default');
    if (!parsed) {
      this.requestUpdate();
      return;
    }

    // Impossible date (e.g. Feb 31): surface the error, nothing to advance to.
    if (parsed.error && !parsed.iso) {
      this.dispatchEvent(
        new CustomEvent('inputError', { detail: { message: parsed.error }, bubbles: true }),
      );
      this.requestUpdate();
      return;
    }

    // Out of bounds: advance the value (so a host popover reflects it) then error.
    if (parsed.error && parsed.iso) {
      this.dispatchEvent(
        new CustomEvent('change', { detail: { value: parsed.iso }, bubbles: true }),
      );
      this.dispatchEvent(
        new CustomEvent('inputError', { detail: { message: parsed.error }, bubbles: true }),
      );
      this.requestUpdate();
      return;
    }

    this.value = parsed.iso as string;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true }),
    );
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-date-time': GuiDateTime;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-date-time')) {
  customElements.define('gui-date-time', GuiDateTime);
}
