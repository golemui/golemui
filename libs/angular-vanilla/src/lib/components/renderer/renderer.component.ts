import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, Type } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';
import { ComponentRendererProps } from '@golemui/shared-vanilla';

@Component({
  standalone: true,
  selector: 'gui-renderer-component',
  imports: [CommonModule],
  providers: [Angular.DisplayFieldAdapter],
  templateUrl: './renderer.component.html',
  host: {
    class: 'gui-renderer',
  },
})
export class RendererComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.DisplayWidget;

  protected adapter: Angular.DisplayFieldAdapter<ComponentRendererProps<Type<any>>> = inject(
    Angular.DisplayFieldAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
