import { runLabelComponentTests } from './lib/core-features/label.cy';
import { MountComponentFn } from './lib/utils';
import { runAlertComponentTests } from './lib/vanilla-features/alert.cy';
import { runValidatorsComponentTests } from './lib/vanilla-features/validators.cy';
import { runIncludeExcludeComponentTests } from './lib/core-features/include-exclude.cy';

export function mountAndTest(mountFn: MountComponentFn) {
  const coreTests = [
    runIncludeExcludeComponentTests,
    runValidatorsComponentTests,
    runLabelComponentTests,
  ];
  const vanillaTests = [runAlertComponentTests];
  [...coreTests, ...vanillaTests].forEach((testFn) => testFn(mountFn));
}
