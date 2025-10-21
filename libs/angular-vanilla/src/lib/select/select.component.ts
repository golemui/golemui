import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

type Option = {
  label: string;
  value: string;
};
type SelectProps = {
  optionsLoading: boolean;
  options: Option[];
};

@Component({
  standalone: true,
  selector: 'ff-select',
  imports: [CommonModule],
  providers: [Angular.ControlAdapter],
  templateUrl: './select.component.html',
  styleUrl: '../styles.scss',
  host: {
    class: 'ff-select',
  },
})
export class SelectComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlAdapter<string, SelectProps> = inject(Angular.ControlAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.adapter.valueChanged(target.value);
  }
}
