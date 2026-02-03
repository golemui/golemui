import {
  ComponentRef,
  Directive,
  inject,
  Injector,
  input,
  OnInit,
  Type,
  ViewContainerRef,
} from '@angular/core';
import * as Core from '@golemui/core';
import { AngularFormContext } from '../context/form.context';
import { REPEATER_INDEX_TOKEN } from './repeater-index.token';

@Directive({
  selector: '[guiField]',
  standalone: true,
})
export class FieldDirective implements OnInit {
  field = input.required<Core.NonFunctionWidget<string>>();
  private repeaterIndexToken = inject(REPEATER_INDEX_TOKEN);

  private formContext: AngularFormContext<Type<Core.WithWidget>> = inject(AngularFormContext);
  private viewContainerRef = inject(ViewContainerRef);
  private componentRef!: ComponentRef<Core.WithWidget>;

  async ngOnInit() {
    try {
      this.createComponent(await this.formContext.widgetRegistry.loadWidget(this.field().type));
    } catch {
      this.formContext.store.dispatch({
        type: 'SET_FORM_HEALTH',
        payload: {
          formHealth: {
            status: 'errored',
            message: `Field "${this.field().type}" could not be loaded`,
          },
        },
      });
    }
  }

  /**
   *
   * @param injector In case of components that are inside a repeater, we want to pass an injector with the repeater context set.
   * @param repeaterIndex We need to pass the index also because otherwise the top layout component refId is not updated to be unique via the index
   */
  protected createComponent(
    component: Type<Core.WithWidget>,
    injector?: Injector,
    repeaterIndex?: number,
  ) {
    this.componentRef = this.viewContainerRef.createComponent(component, {
      injector,
    });
    const index = repeaterIndex ?? this.repeaterIndexToken;
    if (index > -1) {
      this.componentRef.instance.widget = Core.makeRepeaterItemConfig(
        Core.cloneObject(this.field()),
        index,
      );
    } else {
      this.componentRef.instance.widget = this.field();
    }
    (this.componentRef.location.nativeElement as HTMLElement).id =
      `host-${this.componentRef.instance.widget.uid}`;
  }
}
