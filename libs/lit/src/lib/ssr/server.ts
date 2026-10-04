/**
 * Server-only entry point (@golemui/lit/ssr). It calls @lit-labs/ssr, which is an
 * optional peer dependency: install it in the project that server-renders. Importing
 * this module in a browser bundle is unsupported.
 *
 * The element-level rendering lives in @golemui/lit-utils/ssr, shared with
 * @golemui/gui-components; this module adds the form on top of it.
 */
import type { FormInitConfig, ValidatorFn, WithWidget } from '@golemui/core';
import { html } from 'lit';
import { renderGuiHtml } from '@golemui/lit-utils/ssr';
import '../components/form/form.element';
import type { Type } from '../utils/type';

/**
 * Renders one GolemUI form to an HTML string in plain Node.
 *
 * @param options - The form inputs. `config` must contain an explicit `formName`, and
 * the widgets in `config.widgetLoaders` must already be preloaded with
 * `preloadFormWidgets` so the render can read them synchronously.
 * @returns The rendered markup: a `<gui-core-form>` element holding the complete form.
 * @example
 * await preloadFormWidgets({ widgetLoaders });
 * const markup = await renderGuiFormHtml({ config, validators });
 */
export async function renderGuiFormHtml(options: {
  config: FormInitConfig<Type<WithWidget>>;
  validators: ValidatorFn<any>;
  autocomplete?: string;
  keepMarkers?: boolean;
}): Promise<string> {
  if (!options.config.formName) {
    throw new Error(
      'Server rendering needs an explicit formName in the form config, ' +
        'so the server and the client produce the same markup.',
    );
  }
  return renderGuiHtml(
    html`<gui-core-form
      .config=${options.config}
      .validators=${options.validators}
      .autocomplete=${options.autocomplete}
    ></gui-core-form>`,
    { keepMarkers: options.keepMarkers },
  );
}
