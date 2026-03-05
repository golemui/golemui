import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiInputs } from '../../../services/dx';

export const fourLinerDemo: FormDemoDefinition = {
  title: '1. The Four-Liner',
  category: 'Ch1: First Form',
  description:
    'The simplest possible form. Three fields, four lines. '
    + 'Labels, placeholders, a submit button, and a vertical layout are all generated automatically from the field names.',
  formDef: () =>
    _guiInputs({
      name: 'string',
      age: 'number',
      active: 'boolean',
    }),
};
