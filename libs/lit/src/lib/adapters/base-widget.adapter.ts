import {
  type NonFunctionWidget,
  type WidgetViewModel,
  type WithWidget,
  assertNoPropCollisions,
  widgetViewModel$,
} from '@golemui/core';
import { Subject, takeUntil } from 'rxjs';
import { type LitFormContext } from '../context/form.context';

export abstract class BaseWidgetAdapter<F extends NonFunctionWidget> {
  context!: LitFormContext<WithWidget>;
  templateData: any = {};
  protected destroy$ = new Subject<void>();
  protected widget!: F;

  templateDataChanged$ = new Subject<void>();

  protected setTemplateData(patch: any) {
    this.templateData = { ...this.templateData, ...patch };
    this.templateDataChanged$.next();
  }

  /**
   * Merges each view model emission into templateData: the calculated widget and its props
   * flattened into one object, plus the extra fields the concrete adapter reads from the
   * view model.
   *
   * A hidden widget's view model has no calculated widget, so that part is skipped and the
   * last visible values stay until the parent removes the element.
   */
  protected templateDataUpdater(
    extraFields?: (viewModel: WidgetViewModel) => Record<string, unknown>,
  ) {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), widgetViewModel$(this.widget.uid))
      .subscribe((viewModel) => {
        const patch: Record<string, any> = {};
        const calculatedWidget = viewModel.widget;
        if (calculatedWidget !== undefined) {
          const obj = {
            ...calculatedWidget,
            lang: viewModel.lang,
            deps: this.context.dependencies,
          };
          assertNoPropCollisions(calculatedWidget.uid, calculatedWidget.props, obj);
          Object.assign(patch, obj, calculatedWidget.props);
        }
        if (extraFields) {
          Object.assign(patch, extraFields(viewModel));
        }
        this.setTemplateData(patch);
      });
  }

  destroy() {
    this.destroy$.next();
  }
}
