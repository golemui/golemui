import * as Core from '@golemui/core';
import { WithWidget } from '@golemui/core';
import { Subject, takeUntil } from 'rxjs';
import { LitFormContext } from '../context/form.context';

export abstract class BaseFieldAdapter<F extends Core.FormWidget> {
  context!: LitFormContext<WithWidget>;
  templateData: any = {};
  protected destroy$ = new Subject<void>();
  protected field!: F;

  templateDataChanged$ = new Subject<void>();

  protected setTemplateData(patch: any) {
    this.templateData = { ...this.templateData, ...patch };
    this.templateDataChanged$.next();
  }

  protected addFieldToTheStore(field: F) {
    this.context.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: field },
    });
  }

  // Listen to the calculated props stream and keep all field props merged in a flattened object
  protected templateDataUpdater() {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.calculatedWidgetsByUid$(this.field.uid!))
      .subscribe((calculatedField) => {
        this.setTemplateData({
          ...calculatedField,
          ...calculatedField.props,
          lang: this.context.store.getState().lang,
        });
      });
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_WIDGET',
      payload: { uid: this.field.uid! },
    });
    this.destroy$.next();
  }
}
