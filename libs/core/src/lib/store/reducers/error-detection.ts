import { errorCodes } from '../../errors';
import type { Form } from '../../form';
import { type FormWidget, isInputWidget, isLayoutWidget } from '../../form-widget';
import type { FormHealth, State } from '../model';

/**
 * Form-init error detection and diagnostics.
 *
 * This module is the single home for the checks the `initialize` reducer runs on a freshly received
 * `formDef`. Detectors return a ready-to-use errored `FormHealth` (with the `[code]` prefix already
 * applied) or `null`, so the reducer just forwards the result. New silent-error detections should be
 * added here rather than inlined in the reducer.
 */

/** Builds an errored FormHealth, applying the `[code]` prefix in one place. */
function erroredHealth(code: number, message: string): FormHealth {
  return { status: 'errored', code, message: `[${code}] ${message}` };
}

/** A gui.* facade item, before resolveFormInput expands it, carries `type: 'ITEMS'`. */
function isUnresolvedDxItem(node: unknown): boolean {
  return !!node && typeof node === 'object' && (node as Record<string, unknown>)['type'] === 'ITEMS';
}

function malformedShapeMessage(origin: 'dx' | 'json'): string {
  const common =
    'The form definition was passed to the form in the wrong shape, so its fields were never ' +
    'resolved.';
  const fix =
    origin === 'dx'
      ? 'Suggestion fix: pass the gui.* array DIRECTLY as formDef — `config={{ formDef: form }}` — and put ' +
        'any named `states` in `formConfig`: `config={{ formDef: form, formConfig: { states } }}`. ' +
        'Do NOT wrap them as a `{ form: [...] }` object.'
      : 'Suggestion fix: pass the form definition object DIRECTLY as formDef — ' +
        '`config={{ formDef: { states, form: [...] } }}`. Do NOT wrap it in an extra `{ form: ... }`.';
  return `${common} ${fix}`;
}

/**
 * Detects the "extra `{ form: ... }` wrapper" mistake for BOTH the DX and JSON APIs — the classic
 * case is a form that type-checks but is never resolved, so it renders BLANK. Returns an errored
 * FormHealth carrying a common message plus an API-specific fix, or null when the shape is
 * acceptable to hand to the decoder.
 *
 * - DX origin: gui.* facade items (`type: 'ITEMS'`) survived to core, e.g. `{ form: [gui.input()] }`.
 * - JSON origin: `form` is a non-array object that is not a `kind: 'layout'` widget — the classic
 *   double-wrap `{ form: { states, form: [...] } }`. A valid `form` is either an array (the reducer
 *   auto-wraps it into a layout) or a `kind: 'layout'` widget; anything else here is the wrapper bug.
 */
export function detectMalformedFormShape(formDef: unknown): FormHealth | null {
  if (!formDef || typeof formDef !== 'object' || Array.isArray(formDef)) return null;
  const form = (formDef as Record<string, any>)['form'];

  if (isUnresolvedDxItem(form) || (Array.isArray(form) && form.some(isUnresolvedDxItem))) {
    return erroredHealth(errorCodes.initializeMalformedFormShapeError, malformedShapeMessage('dx'));
  }

  if (form && typeof form === 'object' && !Array.isArray(form) && !isLayoutWidget(form as FormWidget)) {
    return erroredHealth(errorCodes.initializeMalformedFormShapeError, malformedShapeMessage('json'));
  }

  return null;
}

/** Errored FormHealth for two widgets sharing a UID (raised while flattening the form). */
export function uidCollisionError(
  existingWidget: FormWidget<string>,
  newWidget: FormWidget<string>,
): FormHealth {
  const getPath = (f: FormWidget<string>) => (isInputWidget(f) ? ` at "${f.path}"` : '');
  const message = `Duplicate UID "${newWidget.uid}": Assigned to widget "${existingWidget.type}"${getPath(existingWidget)} and "${newWidget.type}"${getPath(newWidget)}.`;
  return erroredHealth(errorCodes.initializeUidCollisionError, message);
}

/**
 * Console-warns when a widget's `include: { in: [...] }` / `exclude: { from: [...] }` names a state that
 * is not declared in the form's `states` (i.e. `formConfig.states` on the gui.* facade). Such a reference
 * never matches an active state, so the widget stays hidden with no other signal — a common silent bug.
 */
export function warnUndeclaredStateReferences(
  flatForm: State['flatForm'],
  declaredStates: Form['states'],
): void {
  const declared = new Set(Object.keys(declaredStates ?? {}));
  const offenders = new Map<string, string[]>(); // state name -> widget uids that reference it
  for (const widget of Object.values(flatForm)) {
    const refs: string[] = [];
    const include = (widget as { include?: { in?: unknown } }).include;
    if (include && Array.isArray(include.in)) refs.push(...(include.in as string[]));
    const exclude = (widget as { exclude?: { from?: unknown } }).exclude;
    if (exclude && Array.isArray(exclude.from)) refs.push(...(exclude.from as string[]));
    for (const name of refs) {
      if (declared.has(name)) continue;
      const uids = offenders.get(name) ?? [];
      uids.push((widget.uid as string) || '(unknown)');
      offenders.set(name, uids);
    }
  }
  if (offenders.size === 0) return;
  const available = declared.size ? [...declared].join(', ') : '(none declared)';
  for (const [name, uids] of offenders) {
    console.error(
      `[GolemUI] include/exclude references undefined state "${name}" (on ${uids.join(', ')}); ` +
        `these widgets will stay hidden. Declared states: ${available}. ` +
        `Fix: declare "${name}" in formConfig.states, or correct the name.`,
    );
  }
}
