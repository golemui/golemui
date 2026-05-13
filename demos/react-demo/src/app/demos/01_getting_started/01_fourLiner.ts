import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const fourLinerDemo: FormDemoDefinition = {
  title: '1. The Four-Liner',
  category: 'Ch1: Getting Started',
  description:
    'The simplest possible form. Three fields, four lines. ' +
    'Labels, placeholders, a submit button, and a vertical layout are all generated automatically from the field names.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.numberInput('age'),
    gui.inputs.booleanInput('active'),
  ],
};
