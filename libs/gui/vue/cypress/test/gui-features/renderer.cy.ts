import { runRendererComponentTests } from '@golemui/ui-testing';
import { mountFramework } from '../../support/mount';
import { renderText } from '../../support/renderer';

runRendererComponentTests(mountFramework, renderText);
