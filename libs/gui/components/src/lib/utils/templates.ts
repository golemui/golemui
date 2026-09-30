import { html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

export type ControlTemplateData<T, V = any> = {
  uid?: string;
  label?: string;
  value?: T;
  errors?: string[];
  validator?: V;
  disabled?: boolean;
  readonly?: boolean;
  touched?: boolean;
  required?: boolean;
};

/**
 * Whether a control shows its errors. `touched` is only tracked by a host that validates on
 * interaction, like GolemUI Forms: `undefined` means it isn't, so errors show as soon as they are
 * set, and `false` holds them back until the user has interacted with the control.
 */
export const showsErrors = (touched: boolean | undefined, errors: string[] | undefined) =>
  touched !== false && !!errors && errors.length > 0;

/**
 * The visual required marker. Hidden from AT — `aria-required` on the control
 * carries the semantics, so screen readers don't announce a stray "star".
 */
export const requiredMarker = (required: boolean | undefined) =>
  required ? html`<span aria-hidden="true"> *</span>` : nothing;

export const addLabel = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: ControlTemplateData<T> & ExtraProps,
  withErrors = false,
  type: string | undefined = undefined,
  isNativeElement = true,
) => {
  // Without a label the hint still renders, on its own: the control's aria-describedby points at
  // it.
  if (!templateData.label) return addHint(uid, templateData);

  if (isNativeElement) {
    return html`<label
      class="gui-label"
      for=${uid}
      data-cy=${`${uid}_label`}
      id=${type ? `${uid}_${type}_label` : `${uid}_label`}
    >
      <span class="gui-label__text"
        >${templateData.label}${requiredMarker(templateData.required)}</span
      >
      ${addHint(uid, templateData, true)} ${withErrors ? addErrors(uid, templateData) : nothing}
    </label>`;
  } else {
    return html`<span
      class="gui-label"
      data-cy=${`${uid}_label`}
      id=${type ? `${uid}_${type}_label` : `${uid}_label`}
    >
      <span class="gui-label__text"
        >${templateData.label}${requiredMarker(templateData.required)}</span
      >
      ${addHint(uid, templateData, true)} ${withErrors ? addErrors(uid, templateData) : nothing}
    </span>`;
  }
};

/**
 * The hint under a label. Inside the label it is hidden from assistive technology, or it would
 * become part of the field's name: the field still reads it as its description, because
 * `aria-describedby` reads the elements it points to even when they are hidden.
 */
export const addHint = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: ControlTemplateData<T> & ExtraProps,
  inLabel = false,
) => {
  const hint = templateData.hint;
  if (!hint) return html``;
  const id = `${uid}_hint`;
  const hidden = inLabel ? 'true' : nothing;
  return html`<div class="gui-widget-hint" id=${id} aria-hidden=${hidden}>${hint}</div>`;
};

export const addIcon = <T, ExtraProps extends { icon?: string }>(
  widgetType: string,
  templateData: ControlTemplateData<T> & ExtraProps,
) => {
  const widgetClasses: { [key: string]: boolean } = {
    [`gui-${widgetType}--icon`]: false,
    [`gui-${widgetType}--icon-right`]: false,
  };

  if (templateData.icon) {
    widgetClasses[`gui-${widgetType}--icon`] = true;

    const classes = {
      'gui-widget-icon': true,
      [templateData.icon]: true,
    };
    return {
      widgetClasses: widgetClasses,
      html: html`<span
        class=${classMap(classes)}
        data-icon=${templateData.icon}
        aria-hidden="true"
      ></span>`,
    };
  } else {
    return { widgetClasses: widgetClasses, html: html`` };
  }
};

export type AddErrorsVariant = 'field' | 'panel' | 'pills';

export const addErrors = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: ControlTemplateData<T> & ExtraProps,
  options?: { variant?: AddErrorsVariant },
) => {
  const variant = options?.variant ?? 'field';
  const showErrors = showsErrors(templateData.touched, templateData.errors);

  if (variant !== 'field' && !showErrors) return nothing;

  const classes = {
    'gui-validator': true,
    'gui-validator--panel': variant !== 'field',
    'gui-validator--empty': !showErrors,
  };

  const id = variant === 'field' ? `${uid}_errors` : `${uid}_${variant}_errors`;
  const dataCyPrefix = variant === 'field' ? `${uid}_validator` : `${uid}_${variant}-validator`;

  // A `div`, not a list: `role="alert"` would override a list's semantics and orphan its items.
  return html`<div
    class=${classMap(classes)}
    id=${id}
    role=${variant === 'field' ? 'alert' : nothing}
    aria-hidden=${variant === 'field' ? nothing : 'true'}
    data-cy=${showErrors ? `${dataCyPrefix}-errors` : nothing}
  >
    ${showErrors
      ? templateData.errors?.map((error: any) => {
          const errorCy = `${dataCyPrefix}-error`;
          return html`<div class="gui-validator__error" data-cy=${errorCy}>${error}</div>`;
        })
      : nothing}
  </div>`;
};

/**
 * Floating panel shared by the picker widgets: wraps the popup layout in a
 * card and repeats the field errors at its bottom, so an open panel never
 * hides what's wrong with the current selection.
 */
export const addPickerPanel = (
  uid: string,
  templateData: { errors?: string[]; touched?: boolean; showErrors?: boolean },
  content: unknown,
  options?: { hidden?: boolean },
) =>
  html`<div class="gui-picker__panel" ?hidden=${options?.hidden ?? false}>
    ${content}
    ${templateData.showErrors ? addErrors(uid, templateData, { variant: 'panel' }) : nothing}
  </div>`;
