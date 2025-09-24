import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

@Component({
  standalone: true,
  selector: 'ff-stack',
  imports: [CommonModule, Angular.FieldDirective],
  providers: [Angular.LayoutAdapter],
  templateUrl: './stack.component.html',
  styleUrl: '../styles.scss',
})
export class StackComponent implements OnInit, OnDestroy, Angular.WithField {
  field!: Core.LayoutField;

  protected adapter: Angular.LayoutAdapter = inject(Angular.LayoutAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
