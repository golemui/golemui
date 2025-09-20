import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

@Component({
  standalone: true,
  selector: 'ff-textinput',
  imports: [CommonModule],
  templateUrl: './textinput.component.html',
  styleUrl: '../styles.scss',
})
export class TextinputComponent implements Angular.WithField {
  field!: Core.ControlField<string>;

  protected templateData: { label?: string; value?: string } = {
    label: 'Label',
    value: 'Hello',
  };
}
