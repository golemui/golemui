import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';
import type { DateRange, RangeDatePickerProps } from '@golemui/gui-shared/internals';
import { ErrorsComponent } from '../../utils/templates/errors.component';
import { LabelComponent } from '../../utils/templates/label.component';
import '@golemui/gui-components/range-calendar';
import '@golemui/gui-components/range-date-input';

@Component({
  standalone: true,
  selector: 'gui-range-date-picker-control',
  imports: [CommonModule, ErrorsComponent, LabelComponent],
  providers: [InputWidgetAdapter],
  templateUrl: './range-date-picker.component.html',
  host: {
    class: 'gui-range-date-picker gui-field',
    '[style.flex]': 'this.adapter.templateData().size',
    '(document:click)': 'onDocumentClick($event)',
    '(focusout)': 'onFocusOut($event)',
    '(dropdowntoggle)': 'onDropdownToggle($event)',
  },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RangeDatePickerComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<DateRange[]>;
  protected adapter: InputWidgetAdapter<DateRange[], RangeDatePickerProps> =
    inject(InputWidgetAdapter);
  private el = inject(ElementRef);

  dateControl = viewChild<ElementRef>('dateControlRef');
  calendarControl = viewChild<ElementRef>('calendarControlRef');

  readonly isCalendarOpen = signal(false);
  readonly focusDate = signal<string | undefined>(undefined);

  // Set by `openCalendar` when the dropdown was open and is being closed as
  // part of opening the calendar. Removing the dropdown removes the focused
  // pill from the DOM, triggering a focusout with `relatedTarget=null` —
  // which would otherwise immediately close the calendar we just opened.
  private _ignoreNextFocusOut = false;

  onFocusOut(event: FocusEvent) {
    if (this._ignoreNextFocusOut) {
      this._ignoreNextFocusOut = false;
      return;
    }
    if (!this.isCalendarOpen()) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && this.el.nativeElement.contains(newFocusTarget)) {
      return;
    }

    this.closeCalendar();
  }

  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (
      targetElement &&
      !this.dateControl()?.nativeElement.contains(targetElement) &&
      !this.calendarControl()?.nativeElement.contains(targetElement)
    ) {
      this.closeCalendar();
    }
  }

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  onChangeDate(event: Event) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged((event as CustomEvent).detail.value);
  }

  onInputError(event: Event) {
    this.adapter.injectValidationIssues([(event as CustomEvent).detail.message]);
  }

  onBlurCalendar() {
    this.adapter.onBlur();
    this.closeCalendar();
  }

  onPillClick(event: Event) {
    this.focusDate.set((event as CustomEvent).detail.range.start);
    this.openCalendar();
  }

  toggleCalendar(event: Event) {
    const target = event.target as HTMLElement;
    const isInputClick = target.closest('.gui-range-date-input__part');
    const isCalendarClick = target.closest('gui-range-calendar');
    if (isInputClick || isCalendarClick) {
      this.openCalendar();
    } else if (this.isCalendarOpen()) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }

  // Dropdown (from the inner gui-pills compact bubble) and the calendar
  // popover are mutually exclusive — opening one closes the other.
  onDropdownToggle(event: Event) {
    const detail = (event as CustomEvent<{ open: boolean }>).detail;
    if (detail?.open && this.isCalendarOpen()) {
      this.closeCalendar();
    }
  }

  openCalendar() {
    const dropdownWasOpen = !!this.el.nativeElement.querySelector('.gui-pills__dropdown');
    if (dropdownWasOpen) this._ignoreNextFocusOut = true;
    this.closePillsDropdown();
    this.isCalendarOpen.set(true);
  }

  closeCalendar() {
    this.isCalendarOpen.set(false);
  }

  private closePillsDropdown() {
    const pills = this.el.nativeElement.querySelector('gui-pills') as
      | (HTMLElement & { closeDropdown?: () => void })
      | null;
    pills?.closeDropdown?.();
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }
}
