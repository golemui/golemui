import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { StackProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-stack',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutFieldAdapter],
  templateUrl: './stack.component.html',
  host: {
    class: 'gui-stack',
  },
})
export class StackComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.LayoutField;

  protected adapter: Angular.LayoutFieldAdapter<StackProps> = inject(Angular.LayoutFieldAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
