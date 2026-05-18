import {
  type ComponentRef,
  Directive,
  inject,
  type Injector,
  input,
  type OnInit,
  type Type,
  ViewContainerRef,
} from '@angular/core';
import { type NonFunctionWidget, type WithWidget, cloneObject, errorCodes, makeRepeaterItemConfig } from '@golemui/core'
import { AngularFormContext } from '../context/form.context';
import { REPEATER_INDEXES_TOKEN } from './repeater-indexes.token';

/**
 * Widgets can either be inside a repeater or not.
 * repeaterIndexesToken: when they are inside of a repeater repeaterIndexesToken is
 * an array with one or more elememnts, otherwise it's an empty array.
 */

@Directive({
  selector: '[guiWidget]',
  standalone: true,
})
export class WidgetDirective implements OnInit {
  widget = input.required<NonFunctionWidget<string>>();
  /**
   * It's either `[]` (not part of a repeater) or `[n1,n2,n...]` (it's the child of a repeater)
   */
  private repeaterIndexesToken = inject(REPEATER_INDEXES_TOKEN);

  private formContext: AngularFormContext<Type<WithWidget>> = inject(AngularFormContext);
  private viewContainerRef = inject(ViewContainerRef);
  private componentRef!: ComponentRef<WithWidget>;

  async ngOnInit() {
    try {
      this.createComponent(await this.formContext.widgetRegistry.loadWidget(this.widget().type));
    } catch {
      const code = errorCodes.widgetCouldNotBeLoaded;
      this.formContext.store.dispatch({
        type: 'SET_FORM_HEALTH',
        payload: {
          formHealth: {
            status: 'errored',
            message: `[${code}] Widget "${this.widget().type}" could not be loaded`,
            code,
          },
        },
      });
    }
  }

  /**
   *
   * @param injector In case of components that are inside a repeater, we want to pass an injector with the repeater context set.
   * @param repeaterIndex We need to be able to pass this index from the repeater-widget.directive, otherwise the top level repeated
   *                      widget (likely a layout that wraps the repeated item) doesn't get its index, because repeaterIndexToken is
   *                      not yet defined.
   */
  protected createComponent(
    component: Type<WithWidget>,
    injector?: Injector,
    repeaterIndex?: number,
  ) {
    this.componentRef = this.viewContainerRef.createComponent(component, {
      injector,
    });

    let repeaterIndexes = [];
    if (repeaterIndex === undefined) {
      repeaterIndexes = this.repeaterIndexesToken;
    } else {
      repeaterIndexes = [...this.repeaterIndexesToken, repeaterIndex];
    }

    if (repeaterIndexes.length > 0) {
      this.componentRef.instance.widget = makeRepeaterItemConfig(
        cloneObject(this.widget()),
        repeaterIndexes,
      );
    } else {
      this.componentRef.instance.widget = this.widget();
    }
    (this.componentRef.location.nativeElement as HTMLElement).id =
      `host-${this.componentRef.instance.widget.uid}`;
  }
}
