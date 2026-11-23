import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { safeDefine } from '@golemui/lit/internals';
import { initValidators } from '@golemui/gui-validators';
import { createFormComponent } from '@golemui/lit';
import { widgetLoaders } from '../widget.loaders';

// The factory binds the gui widget set (loaders and validators) to the shared
// form element class. The subclass only chooses the tag name. Properties:
// config, autocomplete, formHealthBoundary. Methods: getData, setData, setMeta,
// setHealth.
export class FormElement extends createFormComponent<GuiFormInitConfig>({
  widgetLoaders,
  validators: initValidators,
}) {}

safeDefine('gui-form', FormElement);
