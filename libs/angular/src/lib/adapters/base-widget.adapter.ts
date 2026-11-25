import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, type Type, type WritableSignal } from '@angular/core';
import {
  type FormWidget,
  type WidgetViewModel,
  type WithWidget,
  widgetViewModel$,
} from '@golemui/core';
import { assertNoPropCollisions, toDomId } from '@golemui/core/internals';
import { Subject, takeUntil } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

export abstract class BaseWidgetAdapter<F extends FormWidget> {
  protected context = inject(AngularFormContext);
  // Field initializer: `init()` runs outside the injection context.
  protected isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected destroy$ = new Subject<void>();
  protected widget!: F;

  private ids = { formName: '', domId: '' };

  // A new config replaces the store of the same context. The form builds new widgets for the new
  // store, so this store belongs to this widget for its whole life.
  private storeOfWidget: AngularFormContext<Type<WithWidget>>['store'] | undefined;

  /**
   * The form's `formName`. Every DOM id the widget renders starts with it, so two forms on one
   * page never share an id: pass it as `idPrefix` to GolemUI Components. Set by `init`.
   */
  get formName(): string {
    return this.ids.formName;
  }

  /**
   * The widget uid behind the form's name: the DOM id of the widget's control, which the ids of
   * its other parts extend (`${domId}_label`, `${domId}-list`). Set by `init`, once per widget:
   * the form builds its widgets again when it starts again with a new name.
   */
  get domId(): string {
    return this.ids.domId;
  }

  /** Keeps the widget and computes its ids. Every `init` calls it first. */
  protected setWidget(widget: F) {
    this.widget = widget;
    const formName = this.context.formName;
    this.ids = { formName, domId: toDomId(formName, widget.uid as string) };
    this.storeOfWidget = this.context.store;
  }

  /**
   * False after a new config replaced the store this widget started on. A removed widget of the
   * old form can still call its adapter, for example with the blur of a removed input that had the
   * focus. Such a call must not change the new form or send an event to the app.
   *
   * @returns False only when the context no longer holds the store this widget started on. An
   * adapter whose `init` does not call `setWidget` has no kept store, so it returns true.
   */
  protected belongsToCurrentForm(): boolean {
    if (this.storeOfWidget === undefined) {
      return true;
    }
    return this.context.store === this.storeOfWidget;
  }

  /**
   * Feeds the templateData signal from the widget's view model: the calculated widget and its
   * props merged into one flattened object, plus the extra fields the concrete adapter reads
   * from the view model.
   *
   * While the widget is hidden the view model carries no calculated widget, so that part is
   * skipped and the last visible values stay in place until the parent removes the component.
   */
  protected templateDataUpdater<TemplateData extends Record<string, any>>(
    templateData: WritableSignal<TemplateData>,
    extraFields?: (viewModel: WidgetViewModel) => Record<string, unknown>,
  ) {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), widgetViewModel$(this.widget.uid))
      .subscribe((viewModel) => {
        templateData.update((current) => {
          const next: Record<string, any> = { ...current };
          const calculatedWidget = viewModel.widget;
          if (calculatedWidget !== undefined) {
            const obj = {
              ...calculatedWidget,
              lang: viewModel.lang,
              deps: this.context.dependencies,
            };
            assertNoPropCollisions(calculatedWidget.uid, calculatedWidget.props, obj);
            Object.assign(next, obj, calculatedWidget.props);
          }
          if (extraFields) {
            Object.assign(next, extraFields(viewModel));
          }
          return next as TemplateData;
        });
      });
  }

  destroy() {
    this.destroy$.next();
  }
}
