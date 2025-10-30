import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

interface TextinputProps {
  hint?: string;
  placeholder?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

@Component({
  standalone: true,
  selector: 'ff-textinput',
  imports: [CommonModule],
  providers: [Angular.ControlAdapter],
  templateUrl: './textinput.component.html',
  styleUrl: '../styles.scss',
  host: {
    class: 'ff-textinput',
  },
})
export class TextinputComponent implements OnInit, OnDestroy, Core.WithField {
  field!: Core.ControlField<string>;
  protected adapter: Angular.ControlAdapter<string, TextinputProps> = inject(Angular.ControlAdapter);

  ngOnInit(): void {
    this.adapter.init(this.field);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    this.adapter.valueChanged(target.value);
  }
}
