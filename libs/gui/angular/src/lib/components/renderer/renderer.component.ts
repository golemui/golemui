import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit, type Type } from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import type { ComponentRendererProps } from '@golemui/gui-shared/internals';

@Component({
  standalone: true,
  selector: 'gui-renderer-component',
  imports: [CommonModule],
  providers: [DisplayWidgetAdapter],
  templateUrl: './renderer.component.html',
  host: {
    class: 'gui-renderer gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
})
export class RendererComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<ComponentRendererProps<Type<any>>> =
    inject(DisplayWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
