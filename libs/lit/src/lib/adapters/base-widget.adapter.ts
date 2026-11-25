import {
  type FormWidget,
  type WidgetViewModel,
  type WithWidget,
  widgetViewModel$,
} from '@golemui/core';
import { assertNoPropCollisions, toDomId } from '@golemui/core/internals';
import { Subject, takeUntil } from 'rxjs';
import { type LitFormContext } from '../context/form.context';

export abstract class BaseWidgetAdapter<F extends FormWidget> {
  context!: LitFormContext<WithWidget>;
  templateData: any = {};
  protected destroy$ = new Subject<void>();
  protected widget!: F;

  templateDataChanged$ = new Subject<void>();

  private ids = { formName: '', domId: '' };

  // A new config replaces the store of the same context. The form builds new widgets for the new
  // store, so this store belongs to this widget for its whole life.
  private storeOfWidget: LitFormContext<WithWidget>['store'] | undefined;

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
    // An element sets the context before `init`; without one the ids take no prefix.
    const formName = this.context?.formName ?? '';
    this.ids = { formName, domId: toDomId(formName, widget.uid as string) };
    this.storeOfWidget = this.context?.store;
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
    return this.context?.store === this.storeOfWidget;
  }

  private loadEmittedForUid: string | undefined;

  /**
   * True the first time only. A DOM move disconnects and reconnects the element, which re-runs
   * `init`, and the subscription must be recreated there but `load` must not fire again.
   */
  protected shouldEmitLoad(): boolean {
    if (this.loadEmittedForUid === this.widget.uid) {
      return false;
    }
    this.loadEmittedForUid = this.widget.uid as string;
    return true;
  }

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
