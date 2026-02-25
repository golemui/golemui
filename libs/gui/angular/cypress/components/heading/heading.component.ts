import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@golemui/angular';
import * as Core from '@golemui/core';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

@Component({
  standalone: true,
  selector: 'gui-heading',
  imports: [CommonModule],
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
