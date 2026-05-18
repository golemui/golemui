import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit, type Type } from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';
import { type ComponentRendererProps } from '@golemui/gui-shared';

@Component({
  standalone: true,
  selector: 'gui-renderer-component',
  imports: [CommonModule],
  providers: [Angular.DisplayWidgetAdapter],
  templateUrl: './renderer.component.html',
  host: {
    class: 'gui-renderer gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class RendererComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.DisplayWidget;

  protected adapter: Angular.DisplayWidgetAdapter<ComponentRendererProps<Type<any>>> = inject(
    Angular.DisplayWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
