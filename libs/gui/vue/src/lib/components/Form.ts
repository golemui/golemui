import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { initValidators } from '@golemui/gui-validators';
import { createFormComponent, type WidgetSetFormComponent } from '@golemui/vue';
import { widgetLoaders } from '../widget.loaders';

// The factory binds the gui widget set (loaders and validators) to the shared
// form component. The props, emits, and exposed handle stay as declared in
// Form.types.ts.
export const GuiForm: WidgetSetFormComponent<GuiFormInitConfig> =
  createFormComponent<GuiFormInitConfig>({
    widgetLoaders,
    validators: initValidators,
  });

export default GuiForm;
