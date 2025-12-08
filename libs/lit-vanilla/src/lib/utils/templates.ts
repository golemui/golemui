import * as Core from '@golemui/core';
import { html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

export const addLabel = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: Core.ControlTemplateData<T> & ExtraProps,
  withErrors = false,
) => {
  return html`<label class="gui-field__label" for=${uid}>
    ${templateData.label + (templateData.validator?.required ? ' *' : '')}
    ${addHint(uid, templateData)} ${withErrors ? addErrors(uid, templateData) : nothing}
  </label>`;
};

export const addHint = <T, ExtraProps extends { hint?: string }>(
  uid: string,
  templateData: Core.ControlTemplateData<T> & ExtraProps,
) => {
  return templateData.hint
    ? html`<div class="gui-field-hint" id=${`${uid}_hint`}>${templateData.hint}</div>`
    : html``;
};

export const addIcon = <T, ExtraProps extends { icon?: string; iconPosition?: string }>(
  fieldType: string,
  templateData: Core.ControlTemplateData<T> & ExtraProps,
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
  templateData: Core.ControlTemplateData<T> & ExtraProps,
) => {
  const showErrors = templateData.touched && templateData.errors && templateData.errors.length > 0;

  return html`${showErrors
    ? html`<ul class="gui-validator" id=${`${uid}_errors`}>
        ${templateData.errors?.map(
          (error: any) => html`<li class="gui-validator__error" role="status">${error}</li>`,
        )}
      </ul>`
    : ''}`;
};
