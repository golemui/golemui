import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

@Component({
  standalone: true,
  selector: 'app-heading',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.FieldAdapter],
  templateUrl: './heading.component.html',
  styleUrls: ['./heading.component.scss'],
})
export class HeadingComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.Field;

  protected adapter: Angular.FieldAdapter<OwnWidgetProps> = inject(Angular.FieldAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
