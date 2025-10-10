import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

type StackProps = {
  direction?: 'horizontal' | 'vertical';
};

@Component({
  standalone: true,
  selector: 'ff-stack',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutAdapter],
  templateUrl: './stack.component.html',
  styleUrls: ['../styles.scss', './stack.component.scss'],
  host: {
    'class': 'ff-stack'
  }
})
export class StackComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.LayoutField;

  protected adapter: Angular.LayoutAdapter<StackProps> = inject(
    Angular.LayoutAdapter,
  );

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
