import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { safeDefine } from '@golemui/lit/internals';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { initValidators } from '@golemui/gui-validators';
import { createFormComponent } from '@golemui/lit';
import { widgetLoaders } from '../widget.loaders';

// The factory binds the gui widget set (loaders, validators, form input
// resolver) to the shared form element class. The subclass only chooses the
// tag name. Properties: config, autocomplete, formHealthBoundary. Methods:
// setData, setMeta.
export class FormElement extends createFormComponent<GuiFormInitConfig>({
  widgetLoaders,
  validators: initValidators,
  resolveFormInput,
}) {}

safeDefine('gui-form', FormElement);
