import * as Core from '@golemui/core';
import { WithField } from '@golemui/core';
import { Subject } from 'rxjs';
import { LitFormContext } from '../context/form.context';

export abstract class BaseFieldAdapter<F extends Core.FormField> {
  context!: LitFormContext<WithField>;
  protected destroy$ = new Subject<void>();
  protected field!: F;
  protected templateData: any = {};

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

  // Listen to the form states stream and keep all `props` in sync with the current state
  protected propsUpdaterByCurrentState<ExtraProps extends Record<string, any>>(
    templateData: ExtraProps,
  ) {
    Core.propsUpdaterByCurrentState({
      field: this.field,
      context: this.context,
      updaterFn: (updatedProps) => {
        this.setTemplateData({
          ...templateData,
          ...updatedProps,
        });
      },
      destroy$: this.destroy$,
    });
  }

  destroy() {
    this.context.store.dispatch({
      type: 'REMOVE_FIELD',
      payload: { uid: this.field.uid },
    });
    this.destroy$.next();
  }
}
