import { describe, it } from 'vitest';
import { processDx, getStaticChild } from './src/lib/dx/__tests__/helpers';
import { _guiTextInput } from './src/lib/dx/shortcuts/inputs/guiTextInput.impl';
import { _gslInputs, _gslInputById } from './src/lib/dx/shortcuts/inputs/register';
import { _gslTextInputs } from './src/lib/dx/shortcuts/inputs/gslInputSubtypes';

describe('probe', () => {
  it('logs actual output', () => {
    const result = processDx(
      _guiTextInput('email'),
      [
        _gslInputs({ decorator: { placeholder: 'From inputs' } }),
        _gslTextInputs({ decorator: { hint: 'From textInputs' } }),
      ],
    );
    const input = getStaticChild(result, 0);
    console.log('INPUT FULL:', JSON.stringify(input, null, 2));
  });
});
