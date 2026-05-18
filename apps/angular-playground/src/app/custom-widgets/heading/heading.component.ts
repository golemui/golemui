import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import type * as Core from '@golemui/core';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

@Component({
  standalone: true,
  selector: 'app-heading',
  imports: [CommonModule, Angular.WidgetDirective],
  providers: [Angular.DisplayWidgetAdapter],
  templateUrl: './heading.component.html',
  styleUrls: ['./heading.component.scss'],
})
export class HeadingComponent implements OnInit, OnDestroy, Core.WithWidget {
  widget!: Core.DisplayWidget;

  protected adapter: Angular.DisplayWidgetAdapter<OwnWidgetProps> = inject(
    Angular.DisplayWidgetAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
