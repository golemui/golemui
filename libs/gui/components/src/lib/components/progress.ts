import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GuiElement } from '../gui-element';
import { booleanAttribute } from '../utils/converters';
import { warnInDevelopment } from '../utils/dev';
import { isRealNumber } from '../utils/numeric';
import { addLabel } from '../utils/templates';

const DEFAULT_MAX = 100;

const percentFormats = new Map<string, Intl.NumberFormat>();

/** A share from 0 to 1 as a whole percentage, in the locale. */
const formatPercent = (share: number, localeId: string): string => {
  let format = percentFormats.get(localeId);
  if (!format) {
    try {
      format = new Intl.NumberFormat(localeId, { style: 'percent', maximumFractionDigits: 0 });
    } catch {
      format = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 });
    }
    percentFormats.set(localeId, format);
  }
  return format.format(share);
};

/**
 * How far a task has got, such as an upload: a native `<progress>` with its label. Without a
 * `value` it is indeterminate: the task is running, and how far it has got is unknown.
 *
 * ```html
 * <gui-progress label="Uploading" value="40" max="100" show-value></gui-progress>
 * ```
 *
 * The label names it for screen readers, which read its value as a percentage. It is not a form
 * control: it has no value to submit.
 */
export class GuiProgress extends GuiElement {
  /** Its name, shown above the bar. Screen readers read it with the value. */
  @property({ type: String }) label: string | undefined = undefined;
  /** How far the task has got, from 0 to `max`. Without it the bar is indeterminate. */
  @property({ type: Number }) value: number | undefined = undefined;
  /** The value of a finished task. Defaults to 100. */
  @property({ type: Number }) max: number | undefined = DEFAULT_MAX;
  /** Shows the percentage at the end of the label's line, formatted in `locale-id`. */
  @property({ converter: booleanAttribute, attribute: 'show-value' }) showValue:
    | boolean
    | undefined = false;
  /** BCP 47 locale for the percentage, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';

  override createRenderRoot() {
    return this;
  }

  /** `max`, or the default for anything that isn't a positive number. */
  private get maximum(): number {
    return isRealNumber(this.max) && this.max > 0 ? this.max : DEFAULT_MAX;
  }

  /** The value within 0 and `max`, as the native bar shows it, or `undefined` while indeterminate. */
  private get current(): number | undefined {
    if (!isRealNumber(this.value)) return undefined;
    return Math.min(this.maximum, Math.max(0, this.value));
  }

  override render() {
    const value = this.current;
    const max = this.maximum;
    // Hidden from assistive technology: the progress bar reads its own value.
    const shownValue =
      this.showValue && value !== undefined
        ? html`<span class="gui-progress__value" aria-hidden="true"
            >${formatPercent(value / max, this.localeId || 'en')}</span
          >`
        : nothing;

    return html`
      ${addLabel(this, { label: this.label }, false, undefined, true, shownValue)}
      <progress
        id=${this.domId}
        class="gui-progress__bar"
        data-cy=${`${this.uid}_progress`}
        max=${max}
        value=${value ?? nothing}
      ></progress>
    `;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.label) {
      warnInDevelopment(this, 'has no label, so its progress bar has no accessible name.');
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-progress': GuiProgress;
  }
}

safeDefine('gui-progress', GuiProgress);
