import * as Core from '@golemui/core';
import { WithField } from '@golemui/core';
import { Subject, takeUntil } from 'rxjs';
import { LitFormContext } from '../context/form.context';

export abstract class BaseFieldAdapter<F extends Core.FormField> {
  context!: LitFormContext<WithField>;
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
      type: 'ADD_FIELD',
      payload: { field },
    });
  }

  // Listen to the calculated props stream and keep all field props merged in a flattened object
  protected templateDataUpdater() {
    this.context.store.state$
      .pipe(takeUntil(this.destroy$), Core.calculatedFieldsByUid$(this.field.uid!))
      .subscribe((calculatedField) => {
        this.setTemplateData({
          ...calculatedField,
          ...calculatedField.props,
          ...(calculatedField as Core.InteractiveField<string>).on,
        });
      });
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_FIELD',
      payload: { uid: this.field.uid! },
    });
    this.destroy$.next();
  }
}
