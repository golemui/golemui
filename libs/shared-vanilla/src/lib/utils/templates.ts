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

export const addLabel = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: ControlTemplateData<T> & ExtraProps,
  withErrors = false,
  type: string | undefined = undefined,
) => {
  return templateData.label
    ? html`<label
        class="gui-label"
        for=${uid}
        data-cy=${`${uid}_label`}
        id=${type ? `${uid}_${type}_label` : `${uid}_label`}
      >
        ${templateData.label + (templateData.required ? ' *' : '')} ${addHint(uid, templateData)}
        ${withErrors ? addErrors(uid, templateData) : nothing}
      </label>`
    : nothing;
};

export const addHint = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: ControlTemplateData<T> & ExtraProps,
) => {
  return templateData.hint
    ? html`<div class="gui-field-hint" id=${`${uid}_hint`}>${templateData.hint}</div>`
    : html``;
};

export const addIcon = <T, ExtraProps extends { icon?: string; iconPosition?: string }>(
  fieldType: string,
  templateData: ControlTemplateData<T> & ExtraProps,
) => {
  const fieldClasses: { [key: string]: boolean } = {
    [`gui-${fieldType}--icon`]: false,
    [`gui-${fieldType}--icon-right`]: false,
  };

  if (templateData.icon) {
    fieldClasses[`gui-${fieldType}--icon`] = true;
    fieldClasses[`gui-${fieldType}--icon-right`] = templateData.iconPosition === 'right';

    const classes = {
      'gui-field-icon': true,
      'gui-field-icon--right': templateData.iconPosition === 'right',
      [templateData.icon]: true,
    };
    return {
      fieldClasses: fieldClasses,
      html: html`<span class=${classMap(classes)}></span>`,
    };
  } else {
    return { fieldClasses: fieldClasses, html: html`` };
  }
};

export const addErrors = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: ControlTemplateData<T> & ExtraProps,
) => {
  const showErrors = templateData.touched && templateData.errors && templateData.errors.length > 0;

  return html`${showErrors
    ? html`<ul class="gui-validator" id=${`${uid}_errors`} data-cy=${`${uid}_validator-errors`}>
        ${templateData.errors?.map(
          (error: any) =>
            html`<li class="gui-validator__error" role="alert" data-cy=${`${uid}_validator-error`}>
              ${error}
            </li>`,
        )}
      </ul>`
    : ''}`;
};
