import {
  ComponentRef,
  Directive,
  inject,
  input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import * as Core from '@formforge/core';
import { AngularFormContext } from '../context/form.context';

@Directive({
  selector: '[ffField]',
  standalone: true,
})
export class FieldDirective implements OnInit {
  field = input.required<Core.FormField<string>>();

  private formContext = inject(AngularFormContext);
  private viewContainerRef = inject(ViewContainerRef);
  private componentRef!: ComponentRef<Core.WithField>;

  async ngOnInit() {
    try {
      this.componentRef = this.viewContainerRef.createComponent(
        await this.formContext.fieldRegistry.loadField(this.field().widget),
      );
      this.componentRef.instance.field = this.field();
    } catch {
      this.formContext.store.dispatch({
        type: 'SET_ERROR',
        payload: {
          error: {
            kind: 'fatal',
            error: `Field "${this.field().widget}" could not be loaded`,
          },
        },
      });
    }
  }
}
