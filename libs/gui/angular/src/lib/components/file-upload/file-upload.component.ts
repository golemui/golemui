import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import type { FileItem, FileUploadProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/file-upload';

@Component({
  standalone: true,
  selector: 'gui-file-upload-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './file-upload.component.html',
  host: {
    class: 'gui-file-upload gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FileUploadComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<FileItem | null>;
  protected adapter: InputWidgetAdapter<FileItem | null, FileUploadProps> =
    inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value as FileItem | null;
    this.adapter.valueChanged(value);
  }
}
