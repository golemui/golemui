import { CommonModule } from '@angular/common';
import { Component, inject, type OnDestroy, type OnInit } from '@angular/core';
import { InputWidgetAdapter } from '@golemui/angular';
import type { InputWidget, WithWidget } from '@golemui/core';

@Component({
  standalone: true,
  selector: 'gui-customdate',
  imports: [CommonModule],
  providers: [InputWidgetAdapter],
  templateUrl: './custom-date.component.html',
  host: {
    class: 'gui-customdate',
  },
})
export class CustomdateComponent implements OnInit, OnDestroy, WithWidget {
  widget!: InputWidget<string>;
  protected adapter: InputWidgetAdapter<string, Record<string, any>> = inject(InputWidgetAdapter);

  ngOnInit(): void {
    this.adapter.init(this.widget);
  }

  ngOnDestroy(): void {
    this.adapter.destroy();
  }

  valueChanged(event: Event) {
    const target = event.target as HTMLInputElement;
    this.adapter.valueChanged(target.value);
    this.injectValidationIssues(target.value ?? '');
  }

  private injectValidationIssues(ddmmyyyy: string) {
    if (ddmmyyyy.length === 0) {
      this.adapter.injectValidationIssues(null);
      return;
    }

    // expected value format: dd-mm-yyyy
    const regEx = /^(\d{2})-(\d{2})-(\d{4})$/;
    const results = regEx.exec(ddmmyyyy);

    if (!results) {
      this.adapter.injectValidationIssues(['Invalid date format']);
      return;
    }

    const day = Number(results[1]); // 01 -> 31
    const month = Number(results[2]); // 01 -> 12
    const year = Number(results[3]);

    // basic range checks
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      this.adapter.injectValidationIssues(['Impossible date']);
      return;
    }

    // calendar-validity check
    const date = new Date(year, month - 1, day);
    const isValid =
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

    if (!isValid) {
      this.adapter.injectValidationIssues(['Invalid date']);
      return;
    }

    this.adapter.injectValidationIssues(null);
  }
}
