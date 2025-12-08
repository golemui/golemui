import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { TextinputProps } from '@golemui/shared-vanilla';
import { LabelComponent } from '../../utils/templates/label.component';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { IconComponent } from '../../utils/templates/icon.component';
import { GuiAriaDirective } from '../../directives/aria.directive';

@Component({
  standalone: true,
  selector: 'gui-textinput',
  imports: [CommonModule, LabelComponent, ErrorsComponent, IconComponent, GuiAriaDirective],
  providers: [Angular.ControlFieldAdapter],
  templateUrl: './textinput.component.html',
  host: {
    class: 'gui-textinput',
  },
})
export class TextinputComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlFieldAdapter<string, TextinputProps> = inject(
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
    this.adapter.valueChanged(target.value);
  }
}
