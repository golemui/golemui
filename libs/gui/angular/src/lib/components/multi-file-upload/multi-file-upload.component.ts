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
import type { FileItem, MultiFileUploadProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/multi-file-upload';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-multi-file-upload-control',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './multi-file-upload.component.html',
  host: {
    class: 'gui-multi-file-upload gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MultiFileUploadComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<FileItem[]>;
  protected adapter: InputWidgetAdapter<FileItem[], MultiFileUploadProps> =
    inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const value = (event as CustomEvent).detail.value as FileItem[];
    this.adapter.valueChanged(value);
  }
}
