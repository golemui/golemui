import { InjectionToken } from '@angular/core';

export const REPEATER_INDEXES_TOKEN = new InjectionToken<number[]>('RepeaterIndexes', {
  factory: () => [],
});
