import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { GridProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-grid-layout',
  imports: [CommonModule, Angular.WidgetDirective],
  providers: [Angular.LayoutWidgetAdapter],
  templateUrl: './grid.component.html',
  host: {
    class: 'gui-grid gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class GridComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.LayoutWidget;

  protected adapter: Angular.LayoutWidgetAdapter<GridProps> = inject(Angular.LayoutWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
