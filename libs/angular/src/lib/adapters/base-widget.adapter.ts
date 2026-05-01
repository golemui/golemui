import { inject, WritableSignal } from '@angular/core';
import * as Core from '@golemui/core';
import { Subject, takeUntil } from 'rxjs';
import { AngularFormContext } from '../context/form.context';

export abstract class BaseWidgetAdapter<F extends Core.NonFunctionWidget> {
  protected context = inject(AngularFormContext);
  protected destroy$ = new Subject<void>();
  protected widget!: F;

  protected addWidgetToTheStore(widget: F) {
    this.context.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: widget },
    });
  }

  // Listen to the calculated props stream and keep all widget props merged in a flattened object
  protected templateDataUpdater<TemplateData extends Record<string, any>>(
    templateData: WritableSignal<TemplateData>,
  ) {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.calculatedWidgetsByUid$(this.widget.uid))
      .subscribe((calculatedWidget) => {
        templateData.update((current) => {
          const obj = {
            ...calculatedWidget,
            lang: this.context.store.getState().lang,
            deps: this.context.dependencies,
          };
          Core.assertNoPropCollisions(current['uid'], calculatedWidget.props, obj);
          return {
            ...current,
            ...obj,
            ...calculatedWidget.props,
          };
        });
      });
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_WIDGET',
      payload: { uid: this.widget.uid },
    });
    this.destroy$.next();
  }
}
