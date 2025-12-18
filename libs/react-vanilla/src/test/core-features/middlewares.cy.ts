import { runMiddlewaresComponentTests } from '@golemui/ui-testing';
import { mountFramework } from '../../../cypress/support/mount';

runMiddlewaresComponentTests(mountFramework);
