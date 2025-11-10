import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

@Component({
  standalone: true,
  selector: 'ff-button',
  imports: [CommonModule],
  providers: [Angular.InteractiveAdapter],
  templateUrl: './button.component.html',
  styleUrl: '../styles.scss',
  host: {
    class: 'ff-button',
  },
})
export class ButtonComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.InteractiveField;
  protected adapter: Angular.InteractiveAdapter = inject(Angular.InteractiveAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  onClick() {
    this.adapter.click();
  }
}
