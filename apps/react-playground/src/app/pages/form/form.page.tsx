import * as AppsShared from '@golemui/apps-shared';
import { kitchenSink } from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import { ReactItemRenderer } from '@golemui/react';
import { FormComponent } from '@golemui/react-vanilla';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import i18next from 'i18next';
import { useState } from 'react';
import { AirportItemRenderer } from '../../item-renderers/AirportItemRenderer';
import { ComplexListItemRenderer } from '../../item-renderers/ComplexListItemRenderer';
import { ProductItemRenderer } from '../../item-renderers/ProductItemRenderer';
import styles from './form.page.module.scss';

async function onFormEvent(event: Core.FormEvent) {
  AppsShared.onFormEvent(event);
}

const mock = kitchenSink;
const formDef = mock.form;
const formData = mock.data;
const localization = AppsShared.initializeI18n(mock.resources);
const languages = AppsShared.commonLanguages
  .filter(({ code }) => Object.keys(mock.resources).includes(code))
  .map(({ code, label, flag }) => ({
    value: code,
    label: `${flag} ${label}`,
  }));

const customWidgetLoaders = {
  heading: async () =>
    (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
};
const middlewares = [AppsShared.loggerMiddleware];
const validators: ValidatorsVanilla.CustomValidatorSchemas = {
  allowedNames: AppsShared.allowedNames,
};
const itemRenderers: Record<string, ReactItemRenderer<any>> = {
  complexListItemRenderer: ComplexListItemRenderer,
  productItemRenderer: ProductItemRenderer,
  airportItemRenderer: AirportItemRenderer,
};
const validateOn: Core.ValidateOn = 'eager';

export function FormPage() {
  const [error, setError] = useState('');

  function onFormHealth(formHealth: Core.FormHealth) {
    if (formHealth.status === 'errored') {
      setError(formHealth.message);
    }
  }

  return (
    <div>
      {languages.length > 0 ? <LanguagePicker /> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      <FormComponent
        formDef={formDef}
        data={formData}
        widgetLoaders={customWidgetLoaders}
        middlewares={middlewares}
        itemRenderers={itemRenderers}
        localization={localization}
        validators={validators}
        validateOn={validateOn}
        formHealth={onFormHealth}
        formEvent={onFormEvent}
      />
    </div>
  );
}

function onLanguageChanged(event: React.ChangeEvent<HTMLSelectElement>) {
  const code = (event.nativeEvent as CustomEvent<{ value: string }>).detail.value;
  i18next.changeLanguage(code);
}

function LanguagePicker() {
  return (
    <div>
      <gui-select
        label="Language picker"
        uid="language"
        value="en"
        options={languages}
        onChange={onLanguageChanged}
      ></gui-select>
    </div>
  );
}

export default FormPage;
