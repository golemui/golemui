import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { DisplayWidgetAdapter } from '@golemui/angular';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { imageClasses, type ImageProps } from '@golemui/gui-shared/internals';

@Component({
  standalone: true,
  selector: 'gui-image-display',
  providers: [DisplayWidgetAdapter],
  templateUrl: './image.component.html',
  host: {
    class: 'gui-image-field gui-field',
  },
})
export class ImageComponent implements OnInit, OnDestroy, WithWidget {
  widget!: DisplayWidget;

  protected adapter: DisplayWidgetAdapter<ImageProps> = inject(DisplayWidgetAdapter);
  protected readonly imageClasses = imageClasses;

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
