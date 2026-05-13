import { FormDemoDefinition } from '../../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const widgetFieldPlumbingDemo: FormDemoDefinition = {
  title: '14. Widget Field Plumbing (Gate 1.2.2.1)',
  category: 'Ch2: Input Widgets',
  description:
    'Gate demo for Phase 1.2.2.1. Exercises three fixes: ' +
    '(1) defaultValue — Calendar starts with 2026-02-13, Name starts with "Alice". ' +
    '(2) size — Name takes 1x and Surname takes 2x width in the horizontal row. ' +
    '(3) validateOn — set to "blur" via formConfig. Name requires min 3 chars — ' +
    'type "Al" and tab away to see the error appear on blur (not while typing).',
  formDef: () => [
    gui.layouts.horizontalFlex([
      gui.inputs.textInput('name', { defaultValue: 'Alice', size: 1, validator: { minLength: 3 } }),
      gui.inputs.textInput('surname', { size: 2 }),
    ]),
    gui.inputs.calendar('startDate', { defaultValue: '2026-02-13' }),
  ],
  formConfig: () => ({ validateOn: 'blur' }),
};
