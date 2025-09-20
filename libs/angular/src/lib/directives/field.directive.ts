import {
  ComponentRef,
  Directive,
  inject,
  input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import * as Core from '@formforge/core';
import { FormContext } from '../context/form.context';
import { WithField } from './with-field.type';

@Directive({
  selector: '[ffField]',
  standalone: true,
})
export class FieldDirective implements OnInit {
  field = input.required<Core.FormField>();

  private formContext = inject(FormContext);
  private viewContainerRef = inject(ViewContainerRef);
  private componentRef!: ComponentRef<WithField>;

  async ngOnInit() {
    this.componentRef = this.viewContainerRef.createComponent(
      await this.formContext.fieldRegistry.loadField(this.field().widget),
    );
    this.componentRef.instance.field = this.field();
  }
}
