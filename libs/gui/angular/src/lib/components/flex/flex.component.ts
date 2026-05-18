import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';
import { type FlexProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-flex-layout',
  imports: [CommonModule, Angular.WidgetDirective],
  providers: [Angular.LayoutWidgetAdapter],
  templateUrl: './flex.component.html',
  host: {
    class: 'gui-flex gui-field',
    '[style.flex]': 'this.adapter.templateData().size ?? 1',
  },
})
export class FlexComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.LayoutWidget;

  protected adapter: Angular.LayoutWidgetAdapter<FlexProps> = inject(Angular.LayoutWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
