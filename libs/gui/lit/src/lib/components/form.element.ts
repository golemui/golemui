import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { initValidators } from '@golemui/gui-validators';
import { createFormComponent } from '@golemui/lit';
import { customElement } from 'lit/decorators.js';
import { widgetLoaders } from '../widget.loaders';

// The factory binds the gui widget set (loaders, validators, form input
// resolver) to the shared form element class. The subclass only chooses the
// tag name. Properties: config, autocomplete, formHealthBoundary. Methods:
// setData, setMeta.
@customElement('gui-form')
export class FormElement extends createFormComponent<GuiFormInitConfig>({
  widgetLoaders,
  validators: initValidators,
  resolveFormInput,
}) {}
