import {
  type NonFunctionWidget,
  type WidgetViewModel,
  type WithWidget,
  assertNoPropCollisions,
  widgetViewModel$,
} from '@golemui/core';
import { toDomId } from '@golemui/core/internals';
import { Subject, takeUntil } from 'rxjs';
import { type LitFormContext } from '../context/form.context';

export abstract class BaseWidgetAdapter<F extends NonFunctionWidget> {
  context!: LitFormContext<WithWidget>;
  templateData: any = {};
  protected destroy$ = new Subject<void>();
  protected widget!: F;

  templateDataChanged$ = new Subject<void>();

  private ids = { formName: '', domId: '' };

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
