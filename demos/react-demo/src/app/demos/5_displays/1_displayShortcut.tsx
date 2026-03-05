import { _guiDisplay } from '../../../services/dx/shortcuts/display/guiDisplay.impl';
import { _guiInputs } from '../../../services/dx/shortcuts/inputs/guiInputs.impl';
import { _guiTextInput } from '../../../services/dx/shortcuts/inputs/guiTextInput.impl';
import { FormDemoDefinition } from '../../formRegistry.domain';

export const displayShortcutDemo: FormDemoDefinition = {
  title: 'Displays / Display Shortcut',
  category: 'Displays',
  description:
    'Render arbitrary TSX in a form — via _guiDisplay or plain inline functions. '
    + 'Includes a dynamic error summary that reacts to form validation state.',
  formDefSource: `[
  // Plain function — auto-wrapped into _guiDisplay
  () => <h2>Contact Us</h2>,
  _guiInputs({ firstName: 'string', lastName: 'string' }),
  _guiTextInput('email', {
    placeholder: 'you@example.com',
    validator: { required: true, pattern: '^[^@]+@[^@]+$' },
  }),
  // Explicit _guiDisplay with params — dynamic error summary
  _guiDisplay((params) => {
    const errors = params.errors;
    if (!errors || errors.length === 0) return null;
    return (
      <div style={{ color: 'red', marginTop: '1rem' }}>
        <strong>Please fix the following errors:</strong>
        <ul>
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </div>
    );
  }),
]`,
  formDef: () => [
    // Plain function — auto-wrapped into _guiDisplay
    () => <h2>Contact Us</h2>,
    _guiInputs({
      firstName: 'string',
      lastName: 'string',
    }),
    _guiTextInput('email', {
      placeholder: 'you@example.com',
      validator: { required: true, pattern: '^[^@]+@[^@]+$' },
    }),
    // Explicit _guiDisplay with params — dynamic error summary
    _guiDisplay((params) => {
      const errors = params.errors;
      if (!errors || errors.length === 0) return null;
      return (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          <strong>Please fix the following errors:</strong>
          <ul>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      );
    }),
  ],
};
