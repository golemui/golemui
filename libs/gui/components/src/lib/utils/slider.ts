import { isRealNumber } from './numeric';

/** A tick mark on a slider's track: a value, with an optional label under it. */
export type GuiSliderMark = number | { value: number; label?: string };

/** Where a slider shows its value: next to the label, in a bubble over the thumb, both, or nowhere. */
export type GuiSliderValuePlacement = 'label' | 'bubble' | 'both' | 'hidden';

/** The value of a range slider: its low and its high end. */
export type GuiSliderRange = { start: number; end: number };

/** A tick mark ready to draw: where it sits along the track, from 0 to 100. */
export type GuiSliderTick = { value: number; label?: string; percent: number };

/** `marks: true` draws a tick at every step, up to this many; past it, it draws none. */
export const MAX_STEP_TICKS = 101;

/** The bounds and step of a slider, with the defaults of a native range input. */
export function sliderBounds(
  minimum: number | undefined,
  maximum: number | undefined,
  step: number | undefined,
): { min: number; max: number; step: number } {
  const min = isRealNumber(minimum) ? minimum : 0;
  const max = isRealNumber(maximum) && maximum > min ? maximum : min + 100;
  return { min, max, step: isRealNumber(step) && step > 0 ? step : 1 };
}

/** Where a value sits along the track, from 0 to 100. */
export function percentOf(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/** The value a native range input would hold: within the bounds, on a step from `min`. */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  const snapped = min + Math.round((value - min) / step) * step;
  // Rounds away the floating point noise of decimal steps (0.1 + 0.2).
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Math.min(max, Math.max(min, Number(snapped.toFixed(decimals))));
}

/** The tick marks to draw for `marks`, inside the bounds and in order. */
export function sliderTicks(
  marks: boolean | GuiSliderMark[] | undefined,
  min: number,
  max: number,
  step: number,
): GuiSliderTick[] {
  if (!marks) return [];
  if (marks === true) {
    const count = Math.floor((max - min) / step) + 1;
    if (count > MAX_STEP_TICKS) return [];
    return Array.from({ length: count }, (_, index) => {
      const value = snapToStep(min + index * step, min, max, step);
      return { value, percent: percentOf(value, min, max) };
    });
  }
  return marks
    .map((mark) => (typeof mark === 'number' ? { value: mark } : mark))
    .filter((mark) => isRealNumber(mark.value) && mark.value >= min && mark.value <= max)
    .sort((a, b) => a.value - b.value)
    .map((mark) => ({ ...mark, percent: percentOf(mark.value, min, max) }));
}

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats a slider value for its locale: the value next to the label, the bubbles, the tick
 * labels and the value a screen reader reads.
 *
 * @param format - `Intl.NumberFormat` options, such as `{ style: 'currency', currency: 'EUR' }`.
 */
export function formatSliderValue(
  value: number,
  localeId: string | undefined,
  format: Intl.NumberFormatOptions | undefined,
): string {
  const key = `${localeId}|${JSON.stringify(format ?? {})}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(localeId || 'en', format);
    } catch {
      // An unknown locale or bad options: the plain number still reads.
      formatter = new Intl.NumberFormat('en');
    }
    formatters.set(key, formatter);
  }
  return formatter.format(value);
}
