import { computed, Directive, input } from '@angular/core';
import * as Core from '@golemui/core';

@Directive({
  standalone: true,
  selector: '[guiAria]',
  host: {
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
  },
})
export class GuiAriaDirective<T, ExtraProps extends { hint?: string }> {
  uid = input.required<string>();
  templateData = input.required<Core.ControlTemplateData<T> & ExtraProps>();

  protected ariaDescribedBy = computed(() => {
    const data = this.templateData();
    return data.hint ? this.uid() + '_hint' : null;
  });

  protected ariaInvalid = computed(() => {
    const data = this.templateData();
    const showErrors = data.touched && data.errors && data.errors?.length > 0;
    return showErrors ? 'true' : null;
  });

  protected ariaErrorMessage = computed(() => {
    const data = this.templateData();
    const showErrors = data.touched && data.errors && data.errors?.length > 0;
    return showErrors ? this.uid() + '_errors' : null;
  });

  protected ariaReadonly = computed(() => {
    const data = this.templateData();
    return data.disabled || data.readonly ? 'true' : null;
  });
}
