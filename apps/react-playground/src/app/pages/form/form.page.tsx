import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import { Dependencies } from '@golemui/gui-shared';
import * as GuiValidators from '@golemui/gui-validators';
import { ReactItemRenderer } from '@golemui/react';
import i18next from 'i18next';
import { useEffect, useState } from 'react';
import snarkdown from 'snarkdown';
import { AirportItemRenderer } from '../../item-renderers/AirportItemRenderer';
import { ComplexListItemRenderer } from '../../item-renderers/ComplexListItemRenderer';
import { CountryItemRenderer } from '../../item-renderers/CountryItemRenderer';
import { ProductItemRenderer } from '../../item-renderers/ProductItemRenderer';
import styles from './form.page.module.scss';

const mock = AppsShared.kitchenSink;
const formData = mock.data;
const formMeta = mock.meta;
const localization = AppsShared.initializeI18n(mock.resources);
const languages = AppsShared.commonLanguages
  .filter(({ code }) => Object.keys(mock.resources).includes(code))
  .map(({ code, label, flag }) => ({
    value: code,
    label: `${flag} ${label}`,
  }));
const deps: Dependencies = {
  markdown: {
    parse: (md: string) => snarkdown(md),
  },
};
const customWidgetLoaders = {
  heading: async () =>
    (await import('../../custom-fields/heading/heading.component')).HeadingComponent,
};
const middlewares = [Core.devToolsMiddleware()];
const customValidators: GuiValidators.CustomValidatorSchemas = {
  allowedNames: AppsShared.allowedNames,
};
const itemRenderers: Record<string, ReactItemRenderer<any>> = {
  complexListItemRenderer: ComplexListItemRenderer,
  productItemRenderer: ProductItemRenderer,
  airportItemRenderer: AirportItemRenderer,
  countryItemRenderer: CountryItemRenderer,
};
const validateOn: Core.ValidateOn = 'eager';
function onFormEvent(event: Core.FormEvent) {
  if (mock.onFormEvent) {
    mock.onFormEvent(event);
  }
  AppsShared.onFormEvent(event);
}

export function FormPage() {
  const [error, setError] = useState('');
  const [formDef, setFormDef] = useState<Core.Form<string> | undefined>(undefined);

  useEffect(() => {
    const { form } = mock;
    if (typeof form === 'function') {
      form().then(setFormDef);
    } else {
      setFormDef(form);
    }
  }, []);

  function onFormHealth(formHealth: Core.FormHealth) {
    if (formHealth.status === 'errored') {
      setError(formHealth.message);
    }
  }

  return (
    <div>
      {languages.length > 0 ? <LanguagePicker /> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {formDef && (
        <GuiForm
          config={{
            formDef,
            data: formData,
            meta: formMeta,
            customValidators,
            middlewares,
            itemRenderers,
            localization,
            dependencies: deps,
            customWidgetLoaders,
            validateOn,
          }}
          autocomplete="off"
          formHealth={onFormHealth}
          formEvent={onFormEvent}
        />
      )}
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
