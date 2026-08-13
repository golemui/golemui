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
  if (isNativeElement) {
    return templateData.label
      ? html`<label
          class="gui-label"
          for=${uid}
          data-cy=${`${uid}_label`}
          id=${type ? `${uid}_${type}_label` : `${uid}_label`}
        >
          <span class="gui-label__text"
            >${templateData.label}${requiredMarker(templateData.required)}</span
          >
          ${addHint(uid, templateData)} ${withErrors ? addErrors(uid, templateData) : nothing}
        </label>`
      : nothing;
  } else {
    return templateData.label
      ? html`<span
          class="gui-label"
          data-cy=${`${uid}_label`}
          id=${type ? `${uid}_${type}_label` : `${uid}_label`}
        >
          <span class="gui-label__text"
            >${templateData.label}${requiredMarker(templateData.required)}</span
          >
          ${addHint(uid, templateData)} ${withErrors ? addErrors(uid, templateData) : nothing}
        </span>`
      : nothing;
  }
};

export const addHint = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: ControlTemplateData<T> & ExtraProps,
) => {
  return templateData.hint
    ? html`<div class="gui-widget-hint" id=${`${uid}_hint`}>${templateData.hint}</div>`
    : html``;
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
  const showErrors = templateData.touched && templateData.errors && templateData.errors.length > 0;

  if (variant !== 'field' && !showErrors) return nothing;

  const classes = {
    'gui-validator': true,
    'gui-validator--panel': variant !== 'field',
    'gui-validator--empty': !showErrors,
  };

  const id = variant === 'field' ? `${uid}_errors` : `${uid}_${variant}_errors`;
  const dataCyPrefix = variant === 'field' ? `${uid}_validator` : `${uid}_${variant}-validator`;

  return html`<ul
    class=${classMap(classes)}
    id=${id}
    role=${variant === 'field' ? 'alert' : nothing}
    aria-hidden=${variant === 'field' ? nothing : 'true'}
    data-cy=${showErrors ? `${dataCyPrefix}-errors` : nothing}
  >
    ${showErrors
      ? templateData.errors?.map(
          (error: any) =>
            html`<li class="gui-validator__error" data-cy=${`${dataCyPrefix}-error`}>${error}</li>`,
        )
      : nothing}
  </ul>`;
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
