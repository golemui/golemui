import * as AppsShared from '@golemui/apps-shared';
import { iframeResizer } from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import * as GuiValidators from '@golemui/gui-validators';
import i18next from 'i18next';
import { html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import snarkdown from 'snarkdown';
import { chainingProfileDemo, chainingProfileRefactoredDemo } from '../../forms/chaining';
import {
  eventsBlurDemo,
  eventsChangeDemo,
  eventsClickDemo,
  eventsLoadFilterDemo,
  eventsSubmitDemo,
} from '../../forms/events';
import { multiValueAndDemo, multiValueOrDemo } from '../../forms/multi-value-scopes';
import {
  runtimeDisplayDemo,
  runtimeEventHandlerDemo,
  runtimeLabelDemo,
  runtimeNestedPropDemo,
  runtimeValidatorDemo,
} from '../../forms/runtime-functions';
import { scopeStateDemo, scopeTagDemo } from '../../forms/scope-operators';
import { sensibleDefaultsDemo } from '../../forms/sensible-defaults';
import { statesSupportTicketDemo } from '../../forms/states/support-ticket';
import { tagsHintDemo } from '../../forms/tags/tags-1-hint';
import { tagsGroupingDemo } from '../../forms/tags/tags-2-grouping';
import { tagsPaymentDemo } from '../../forms/tags/tags-3-payment';
import { typeSelectorByUidDemo, typeSelectorDropdownsDemo } from '../../forms/type-selectors';
import { airportItemRenderer } from '../../item-renderers/airport.item-renderer';
import { carItemRenderer } from '../../item-renderers/car.item-renderer';
import { complexListItemRenderer } from '../../item-renderers/complex-list.item-renderer';
import { countryItemRenderer } from '../../item-renderers/country.item-renderer';
import { productItemRenderer } from '../../item-renderers/product.item-renderer';
import { rendererMock } from '../../renderer-mock';
import './form.element.scss';

// In-app form registry for forms that can't be expressed as JSON — typically
// `gui.displays.display(callback)` widgets (whose `render` prop is a function),
// or Programmatic forms that ship with `formSelectors` / `formConfig`.
const RENDERER_FORMS: Record<string, { data: any; form: any; selectors?: any; config?: any }> = {
  'client-name': rendererMock,
  'tags-1-hint': tagsHintDemo,
  'tags-2-grouping': tagsGroupingDemo,
  'tags-3-payment': tagsPaymentDemo,
  'states-support-ticket': statesSupportTicketDemo,
  'runtime-label': runtimeLabelDemo,
  'runtime-validator': runtimeValidatorDemo,
  'runtime-event-handler': runtimeEventHandlerDemo,
  'runtime-nested-prop': runtimeNestedPropDemo,
  'runtime-display': runtimeDisplayDemo,
  'events-click': eventsClickDemo,
  'events-change': eventsChangeDemo,
  'events-load-filter': eventsLoadFilterDemo,
  'events-blur': eventsBlurDemo,
  'events-submit': eventsSubmitDemo,
  'type-selector-dropdowns': typeSelectorDropdownsDemo,
  'type-selector-byuid': typeSelectorByUidDemo,
  'chaining-profile': chainingProfileDemo,
  'chaining-profile-refactored': chainingProfileRefactoredDemo,
  'scope-tag': scopeTagDemo,
  'scope-state': scopeStateDemo,
  'multi-value-and': multiValueAndDemo,
  'multi-value-or': multiValueOrDemo,
  'sensible-defaults': sensibleDefaultsDemo,
};

const mock = AppsShared.template;

@customElement('lit-form')
export class FormElement extends LitElement {
  formThemes: string[] = [];
  formDir: string | null = null;
  config: GuiFormInitConfig | undefined;
  localization = AppsShared.initializeI18n(mock.resources);
  languages = AppsShared.commonLanguages
    .filter(({ code }) => Object.keys(mock.resources).includes(code))
    .map(({ code, label, flag }) => ({
      value: code,
      label: `${flag} ${label}`,
    }));
  customWidgetLoaders = {
    heading: async () =>
      (await import('../../custom-widgets/heading/heading.element')).HeadingElement,
    productCard: async () =>
      (await import('../../custom-widgets/product-card/product-card.element')).ProductCardElement,
    productRating: async () =>
      (await import('../../custom-widgets/product-rating/product-rating.element'))
        .ProductRatingElement,
    productDescription: async () =>
      (await import('../../custom-widgets/product-description/product-description.element'))
        .ProductDescriptionElement,
    productShare: async () =>
      (await import('../../custom-widgets/product-share/product-share.element'))
        .ProductShareElement,
  };
  itemRenderers = {
    complexListItemRenderer: complexListItemRenderer,
    productItemRenderer: productItemRenderer,
    airportItemRenderer: airportItemRenderer,
    countryItemRenderer: countryItemRenderer,
    carItemRenderer: carItemRenderer,
  };
  middlewares = [AppsShared.loggerMiddleware];
  customValidators: GuiValidators.CustomValidatorSchemas = {
    allowedNames: AppsShared.allowedNames,
  };
  validateOn: Core.ValidateOn = 'eager';
  deps: Dependencies = {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  };

  error = '';

  override createRenderRoot() {
    return this;
  }

  async connectedCallback() {
    super.connectedCallback();
    iframeResizer();
    const params = new URLSearchParams(window.location.search);

    let formDef: any = null;
    let formSelectors: any = undefined;
    let formConfig: any = undefined;
    let formData: Record<string, unknown> = {};

    if (params.has('renderer')) {
      const key = params.get('renderer')!;
      const entry = RENDERER_FORMS[key];
      if (entry) {
        formDef = entry.form;
        formData = entry.data ?? {};
        if (entry.selectors) {
          formSelectors = entry.selectors;
        }
        if (entry.config) {
          formConfig = entry.config;
        }
      }
    } else if (params.has('form')) {
      const formDefResponse = await fetch(params.get('form')!);
      formDef = await formDefResponse.json();
    }

    if (params.has('data')) {
      const formDataResponse = await fetch(params.get('data')!);
      formData = await formDataResponse.json();
    }

    if (params.has('theme')) {
      this.formThemes = params.get('theme')?.split('|') ?? [];
    }

    if (params.has('dir')) {
      this.formDir = params.get('dir');
      i18next.changeLanguage('fa');
    }

    this.config = {
      formDef,
      formSelectors,
      formConfig,
      data: formData,
      customWidgetLoaders: this.customWidgetLoaders,
      itemRenderers: this.itemRenderers,
      localization: this.localization,
      middlewares: this.middlewares,
      customValidators: this.customValidators,
      validateOn: this.validateOn,
      dependencies: this.deps,
    };

    this.requestUpdate();
  }

  protected onFormHealth(event: CustomEvent<Core.FormHealth>) {
    const health = event.detail;
    if (health.status === 'errored') {
      this.error = health.message;
    }
    Promise.resolve().then(() => this.requestUpdate());
  }

  protected async onFormEvent(event: CustomEvent<Core.FormEvent>) {
    await AppsShared.onFormEvent(event.detail);
    Promise.resolve().then(() => this.requestUpdate());
  }

  render() {
    const themes = this.formThemes.length > 0 ? this.formThemes : [''];

    if (!this.config) {
      return html`<div>loading...</div>`;
    } else {
      return html`
        ${themes.map(
          (theme) => html`
            <div data-theme=${theme ?? nothing}>
              ${this.error ? html`<p class="error">${this.error}</p>` : null}

              <gui-form
                .config=${this.config}
                @formHealth=${this.onFormHealth}
                @formEvent=${this.onFormEvent}
              ></gui-form>
            </div>
          `,
        )}
      `;
    }
  }
}
