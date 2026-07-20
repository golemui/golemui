import {
  allowedNames,
  commonLanguages,
  initializeI18n,
  kitchenSink,
  onFormEvent,
} from '@golemui/apps-shared';
import {
  type Form,
  type FormEvent,
  type FormHealth,
  type FormSubmitEvent,
  type ValidateOn,
  devToolsMiddleware,
} from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import { type Dependencies, type GuiFormInitConfig } from '@golemui/gui-shared';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import { type FormHealthBoundary, type ReactItemRenderer } from '@golemui/react';
import i18next from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import snarkdown from 'snarkdown';
import { AirportItemRenderer } from '../../item-renderers/AirportItemRenderer';
import { ComplexListItemRenderer } from '../../item-renderers/ComplexListItemRenderer';
import { CountryItemRenderer } from '../../item-renderers/CountryItemRenderer';
import { ProductItemRenderer } from '../../item-renderers/ProductItemRenderer';

const mock = kitchenSink;
const formData = mock.data;
const formMeta = mock.meta;
const localization = initializeI18n(mock.resources);
const languages = commonLanguages
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
const middlewares = [devToolsMiddleware()];
const customValidators: CustomValidatorSchemas = {
  allowedNames: allowedNames,
};
const itemRenderers: Record<string, ReactItemRenderer<any>> = {
  complexListItemRenderer: ComplexListItemRenderer,
  productItemRenderer: ProductItemRenderer,
  airportItemRenderer: AirportItemRenderer,
  countryItemRenderer: CountryItemRenderer,
};
const validateOn: ValidateOn = 'eager';
function formEventHandler(event: FormEvent) {
  if (mock.onFormEvent) {
    mock.onFormEvent(event);
  }
  onFormEvent(event);
}
function formSubmitHandler(event: FormSubmitEvent) {
  console.log('👉 onFormSubmit', event.data);
}

const CustomFormHealthBoundary: FormHealthBoundary = ({ health, children }) => (
  <>
    {health.status === 'errored' && (
      <div
        role="alert"
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '0.5rem',
          borderLeft: '4px solid #b91c1c',
          borderRadius: 4,
          background: '#fef2f2',
          color: '#b91c1c',
        }}
      >
        <strong>This form could not be loaded</strong>
        <div>{health.message}</div>
      </div>
    )}
    {children}
  </>
);

export function FormPage() {
  const [formDef, setFormDef] = useState<Form<string> | undefined>(undefined);

  useEffect(() => {
    const { form } = mock;
    if (typeof form === 'function') {
      form().then(setFormDef);
    } else {
      setFormDef(form);
    }
  }, []);

  const config = useMemo<GuiFormInitConfig | undefined>(
    () =>
      formDef
        ? {
            formDef,
            data: formData,
            meta: formMeta,
            customValidators,
            middlewares,
            itemRenderers,
            localization,
            dependencies: deps,
            functions: mock.functions,
            customWidgetLoaders,
            validateOn,
          }
        : undefined,
    [formDef],
  );

  function onFormHealth(formHealth: FormHealth) {
    if (formHealth.status === 'errored') {
      console.log('GolemUI form health error:', formHealth.message);
    }
  }

  return (
    <div>
      {languages.length > 0 ? <LanguagePicker /> : null}
      {config && (
        <GuiForm
          config={config}
          autocomplete="off"
          formHealthBoundary={CustomFormHealthBoundary}
          formHealth={onFormHealth}
          formEvent={formEventHandler}
          formSubmit={formSubmitHandler}
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
