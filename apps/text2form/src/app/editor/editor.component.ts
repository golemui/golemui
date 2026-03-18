import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent {
  value = input<string>('');
  valueChange = output<string>();

  protected onChange(val: string) {
    this.valueChange.emit(val);
  }
}
