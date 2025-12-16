import { runLabelComponentTests } from './lib/core-features/label.cy';
import { MountComponentFn } from './lib/utils';
import { runAlertComponentTests } from './lib/vanilla-features/alert.cy';
import { runValidatorsComponentTests } from './lib/vanilla-features/validators.cy';

export function mountAndTest(mountFn: MountComponentFn) {
  [runAlertComponentTests, runValidatorsComponentTests, runLabelComponentTests].forEach((testFn) =>
    testFn(mountFn),
  );
}
