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
  providers: [Angular.DisplayFieldAdapter],
  templateUrl: './heading.component.html',
  styleUrls: ['./heading.component.scss'],
})
export class HeadingComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.DisplayField;

  protected adapter: Angular.DisplayFieldAdapter<OwnWidgetProps> = inject(
    Angular.DisplayFieldAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
