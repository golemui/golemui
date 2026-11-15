import { CommonModule, isPlatformServer } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  type ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { InputWidgetAdapter, WidgetDirective } from '@golemui/angular';
import type { InputWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import {
  findRepeaterRowFocus,
  focusAfterRowRemoval,
  type RepeaterProps,
  type RepeaterRowFocus,
} from '@golemui/gui-shared/internals';
import '@golemui/gui-components/label';
import '@golemui/gui-components/errors';
import { deferHydrationAttr } from '../../utils/defer-hydration';

@Component({
  standalone: true,
  selector: 'gui-repeater-control',
  imports: [CommonModule, WidgetDirective],
  providers: [InputWidgetAdapter],
  templateUrl: './repeater.component.html',
  host: {
    class: 'gui-repeater gui-field',
    '[class.gui-repeater--readonly]': '!!this.adapter.templateData().readonly',
    '[class.gui-repeater--disabled]': '!!this.adapter.templateData().disabled',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RepeaterComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<Record<string, unknown>[]>;
  protected adapter: InputWidgetAdapter<
    Record<string, unknown>[],
    RepeaterProps<NonFunctionWidget>
  > = inject(InputWidgetAdapter);
  protected readonly deferHydration = deferHydrationAttr();

  isFocused = false;

  private readonly repeaterCard = viewChild<ElementRef<HTMLElement>>('repeaterRef');
  private rowFocus: RepeaterRowFocus | null = null;

  constructor() {
    // A server render has no focus to keep.
    if (isPlatformServer(inject(PLATFORM_ID))) {
      return;
    }
    // An effect runs before the view update, also when only this view refreshes. In Chromium the
    // `focusout` of the removed input runs it again, so a place whose element is removed is kept.
    effect(() => {
      const rowCount = this.adapter.templateData().rows?.length ?? 0;
      if (this.rowFocus === null || this.rowFocus.focusedElement.isConnected) {
        this.rowFocus = findRepeaterRowFocus(this.repeaterCard()?.nativeElement, rowCount);
      }
    });
    afterRenderEffect({
      write: () => {
        this.adapter.templateData();
        focusAfterRowRemoval(this.repeaterCard()?.nativeElement, this.rowFocus);
        this.rowFocus = null;
      },
    });
  }

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  /** Read only and disabled freeze the number of rows: adding and removing do nothing, whoever calls them. */
  private get locked(): boolean {
    const { readonly, disabled } = this.adapter.templateData();
    return !!readonly || !!disabled;
  }

  addItem() {
    if (this.locked) return;
    const newValue = [...(this.adapter.templateData().value ?? []), {}];
    this.adapter.valueChanged(newValue);
  }

  removeItem(index: number) {
    if (this.locked) return;
    const items = (this.adapter.templateData().value ?? []).filter((_, i) => index !== i);
    // Make sure we don't keep object references
    if ('structuredClone' in window) {
      this.adapter.rowRemoved(structuredClone(items), index);
    } else {
      this.adapter.rowRemoved(JSON.parse(JSON.stringify(items)), index);
    }
  }

  onFocusIn(event: FocusEvent) {
    event.stopPropagation();
    this.isFocused = true;
  }

  onFocusOut(event: FocusEvent) {
    event.stopPropagation();
    this.adapter.onBlur();
    this.isFocused = false;
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
