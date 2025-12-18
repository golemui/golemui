import { runDisabledComponentTests } from './lib/core-features/disabled';
import { runIncludeExcludeComponentTests } from './lib/core-features/include-exclude.cy';
import { runLabelComponentTests } from './lib/core-features/label.cy';
import { runMiddlewaresComponentTests } from './lib/core-features/middlewares.cy';
import { MountComponentFn } from './lib/utils';
import { runAlertComponentTests } from './lib/vanilla-features/alert.cy';
import { runValidatorsComponentTests } from './lib/vanilla-features/validators.cy';

export function mountAndTest(mountFn: MountComponentFn) {
  const coreTests = [
    runMiddlewaresComponentTests,
    runIncludeExcludeComponentTests,
    runValidatorsComponentTests,
    runLabelComponentTests,
    runDisabledComponentTests,
  ];
  const vanillaTests = [runAlertComponentTests];
  [...coreTests, ...vanillaTests].forEach((testFn) => testFn(mountFn));
}
