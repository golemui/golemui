import {
  allowedNames,
  commonLanguages,
  initializeI18n,
  kitchenSink,
  mockUploadService,
} from '@golemui/apps-shared';
import { devToolsMiddleware } from '@golemui/core';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import type { FormHealthBoundary } from '@golemui/lit';
import { html, nothing } from 'lit';
import snarkdown from 'snarkdown';
import { airportItemRenderer } from '../item-renderers/airport.item-renderer';
import { complexListItemRenderer } from '../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../item-renderers/country.item-renderer';
import { productItemRenderer } from '../item-renderers/product.item-renderer';
import { customWidgetLoaders } from '../lib/custom-widget-loaders';

// Shared by the server render (page frontmatter) and the client resume (page script).
export const mock = kitchenSink;

export const languages = commonLanguages
  .filter(({ code }) => Object.keys(mock.resources).includes(code))
  .map(({ code, label, flag }) => ({
    value: code,
    label: `${flag} ${label}`,
  }));

const dependencies: Dependencies = {
  markdown: {
    parse: (md: string) => snarkdown(md),
  },
  uploadService: mockUploadService,
};

export const customFormHealthBoundary: FormHealthBoundary = ({ health, form }) => html`
  ${health.status === 'errored'
    ? html`<div
        role="alert"
        style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-left: 4px solid #b91c1c; border-radius: 4px; background: #fef2f2; color: #b91c1c;"
      >
        <strong>This form could not be loaded</strong>
        <div>${health.message}</div>
      </div>`
    : nothing}
  ${form}
`;

export const config: GuiFormInitConfig = {
  // Stable id: the server and the client must agree on the form id.
  formName: 'astro-json-kitchen-sink',
  formDef: mock.form,
  data: mock.data,
  meta: mock.meta || {},
  localization: initializeI18n(mock.resources),
  dependencies,
  functions: mock.functions,
  customWidgetLoaders,
  itemRenderers: {
    complexListItemRenderer,
    productItemRenderer,
    airportItemRenderer,
    countryItemRenderer,
  },
  middlewares: [devToolsMiddleware()],
  customValidators: {
    allowedNames,
  } as CustomValidatorSchemas,
  validateOn: 'eager',
};
