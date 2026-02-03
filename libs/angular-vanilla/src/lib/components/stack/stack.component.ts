import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { StackProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-stack-layout',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutFieldAdapter],
  templateUrl: './stack.component.html',
  host: {
    class: 'gui-stack',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class StackComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.LayoutWidget;

  protected adapter: Angular.LayoutFieldAdapter<StackProps> = inject(Angular.LayoutFieldAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
