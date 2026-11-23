import { CommonModule } from '@angular/common';
import { type AfterViewInit, Component, input, output, type Type, viewChild } from '@angular/core';
import { type AngularWidgetSet, provideWidgetSet, WidgetSetFormComponent } from '@golemui/angular';
import { cloneObject, type FormEvent, type FormHealth, type FormSubmitEvent } from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { initValidators } from '@golemui/gui-validators';
import { widgetLoaders } from '../../widget.loaders';

// The gui widget set: loaders and validators. The generic WidgetSetFormComponent reads it
// through dependency injection and applies the shared merge precedence rules.
const guiWidgetSet: AngularWidgetSet<GuiFormInitConfig> = {
  widgetLoaders,
  validators: initValidators,
};

@Component({
  imports: [CommonModule, WidgetSetFormComponent],
  selector: 'gui-form',
  providers: [provideWidgetSet(guiWidgetSet)],
  templateUrl: './form.component.html',
})
export class FormComponent implements AfterViewInit {
  config = input.required<GuiFormInitConfig>();
  autocomplete = input<string | undefined>(undefined);
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red banner. */
  formHealthBoundary = input<Type<unknown> | undefined>(undefined);

  private innerForm = viewChild(WidgetSetFormComponent);
  // The inner form does not exist before the view, so these calls wait for it.
  // The view child exists before the first change detection binds its inputs, so its config
  // cannot be read before the view is ready. setData and getData wait for that.
  private viewReady = false;
  private dataBeforeView: Record<string, any> | undefined;
  private metaBeforeView: Record<string, any> | undefined;
  private healthBeforeView: FormHealth | undefined;

  formHealth = output<FormHealth>();
  formEvent = output<FormEvent>();
  formSubmit = output<FormSubmitEvent>();

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataBeforeView) {
      this.innerForm()?.setData(this.dataBeforeView);
      this.dataBeforeView = undefined;
    }
    if (this.metaBeforeView) {
      this.innerForm()?.setMeta(this.metaBeforeView);
      this.metaBeforeView = undefined;
    }
    if (this.healthBeforeView) {
      this.innerForm()?.setHealth(this.healthBeforeView);
      this.healthBeforeView = undefined;
    }
  }

  /**
   * Returns a copy of the form data, as a form event would carry it now: without the values of
   * hidden inputs. Before the form has started, it returns the data the form will start with.
   */
  getData(): Record<string, any> {
    const innerForm = this.innerForm();
    if (innerForm && this.viewReady) {
      return innerForm.getData();
    }
    return cloneObject(this.dataBeforeView ?? this.config().data ?? {});
  }

  setData(data: Record<string, any>): void {
    const innerForm = this.innerForm();
    if (innerForm && this.viewReady) {
      innerForm.setData(data);
    } else {
      this.dataBeforeView = data;
    }
  }

  setMeta(meta: Record<string, any>): void {
    const innerForm = this.innerForm();
    if (innerForm) {
      innerForm.setMeta(meta);
    } else {
      this.metaBeforeView = meta;
    }
  }

  /** Sets the form health. An errored health shows the boundary and freezes the form until `{ status: 'ok' }`. */
  setHealth(health: FormHealth): void {
    const form = this.innerForm();
    if (form) {
      form.setHealth(health);
    } else {
      this.healthBeforeView = health;
    }
  }
}
