import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import { ReactItemRenderer } from '@golemui/react';
import { FormComponent } from '@golemui/react-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import { useState } from 'react';
import { ComplexListItemRenderer } from '../../item-renderers/ComplexListItemRenderer';
import styles from './form.page.module.scss';

async function onFormEvent(event: Core.FormEvent) {
  AppsShared.onFormEvent(event);
}

const formDef = AppsShared.translationsForm;
const formData = AppsShared.translationsFormData;
const localization = AppsShared.i18nTranslator;

const customFieldLoaders = {
  heading: async () =>
    (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
};
const middlewares = [AppsShared.loggerMiddleware];
const validators: ValidatorsVanilla.CustomValidatorSchemas = {
  allowedNames: AppsShared.allowedNames,
};
const itemRenderers: Record<string, ReactItemRenderer<any>> = {
  complexListItemRenderer: ComplexListItemRenderer,
};

export function FormPage() {
  const [error, setError] = useState('');

  function onFormHealth(formHealth: Core.FormHealth) {
    if (formHealth.status === 'errored') {
      setError(formHealth.message);
    }
  }

  return (
    <div>
      {error ? <p className={styles.error}>{error}</p> : null}
      <FormComponent
        formDef={formDef}
        data={formData}
        fieldLoaders={customFieldLoaders}
        middlewares={middlewares}
        itemRenderers={itemRenderers}
        localization={localization}
        validators={validators}
        validateOn="eager"
        formHealth={onFormHealth}
        formEvent={onFormEvent}
      />
    </div>
  );
}

export default FormPage;
