import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { NumberinputProps } from '@golemui/shared-vanilla';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { LabelComponent } from '../../utils/templates/label.component';
import { IconComponent } from '../../utils/templates/icon.component';
import { GuiAriaDirective } from '../../directives/aria.directive';

@Component({
  standalone: true,
  selector: 'gui-number',
  imports: [CommonModule, LabelComponent, ErrorsComponent, IconComponent, GuiAriaDirective],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './number.component.html',
  host: {
    class: 'gui-number',
  },
})
export class NumberComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<number>;
  protected adapter: Angular.ControlFieldAdapter<number, NumberinputProps> = inject(
    Angular.ControlFieldAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    this.adapter.valueChanged(target.valueAsNumber);
  }
}
