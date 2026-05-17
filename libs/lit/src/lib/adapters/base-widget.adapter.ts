import * as Core from '@golemui/core';
import type { WithWidget } from '@golemui/core/internals';
import { Subject, takeUntil } from 'rxjs';
import { LitFormContext } from '../context/form.context';

export abstract class BaseWidgetAdapter<F extends Core.FormWidget> {
  context!: LitFormContext<WithWidget>;
  templateData: any = {};
  protected destroy$ = new Subject<void>();
  protected widget!: F;

  templateDataChanged$ = new Subject<void>();

  protected setTemplateData(patch: any) {
    this.templateData = { ...this.templateData, ...patch };
    this.templateDataChanged$.next();
  }

  protected addWidgetToTheStore(widget: F) {
    this.context.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: widget },
    });
  }

  // Listen to the calculated props stream and keep all widget props merged in a flattened object
  protected templateDataUpdater() {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.calculatedWidgetsByUid$(this.widget.uid!))
      .subscribe((calculatedWidget) => {
        const obj = {
          ...calculatedWidget,
          lang: this.context.store.getState().lang,
          deps: this.context.dependencies,
        };
        Core.assertNoPropCollisions(calculatedWidget['uid'], calculatedWidget.props, obj);
        this.setTemplateData({
          ...obj,
          ...calculatedWidget.props,
        });
      });
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_WIDGET',
      payload: { uid: this.widget.uid! },
    });
    this.destroy$.next();
  }
}
