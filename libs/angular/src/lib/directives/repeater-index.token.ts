import { InjectionToken } from '@angular/core';

export const REPEATER_INDEX_TOKEN = new InjectionToken<number>(
  'RepeaterIndex',
  {
    factory: () => -1,
  },
);
