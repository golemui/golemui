import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import * as Angular from '@formforge/angular';
import * as Core from '@formforge/core';

@Component({
  standalone: true,
  selector: 'ff-stack',
  imports: [CommonModule, Angular.FieldDirective],
  templateUrl: './stack.component.html',
  styleUrl: '../styles.scss',
})
export class StackComponent implements Angular.WithField {
  field!: Core.LayoutField;
}
