import { inject, type WritableSignal } from '@angular/core';
import {
  type NonFunctionWidget,
  type WidgetViewModel,
  assertNoPropCollisions,
  widgetViewModel$,
} from '@golemui/core';
import { Subject, takeUntil } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

export abstract class BaseWidgetAdapter<F extends NonFunctionWidget> {
  protected context = inject(AngularFormContext);
  protected destroy$ = new Subject<void>();
  protected widget!: F;

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
