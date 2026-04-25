import { describe, expect, it } from 'vitest';
import { processDx, getStaticChild } from './helpers';
import { _guiTextInput } from '../shortcuts/inputs/guiTextInput.impl';
import { _gslInputs, _gslInputByUid } from '../shortcuts/inputs/register';
import { _gslTextInputs } from '../shortcuts/inputs/gslInputSubtypes';
import { _gslTag } from '../shortcuts/scopes/gslTag.impl';

describe('DX Pipeline — GSL Selector Precedence', () => {
  it('later selector decorator overrides earlier for the same property', () => {
    const result = processDx(
      _guiTextInput('name'),
      [
        _gslInputs({ override: { placeholder: 'First' } }),
        _gslInputs({ override: { placeholder: 'Second' } }),
      ],
    );
    const input = getStaticChild(result, 0) as {
      props?: { placeholder?: string };
    };

    expect(input.props?.placeholder).toBe('Second');
  });

  it('_gslTextInputs matcher does not apply because decorator type field is absent during matching', () => {
    // NOTE: DecoratorForMatching only carries { itemType, tags, uid } — the decorator's
    // data fields (e.g. 'type: text') are NOT available to the matcher at resolve time.
    // _gslTextInputs uses (d) => d.type === 'text', which always returns false since
    // d.type is undefined in DecoratorForMatching. Only _gslInputs (broad match) applies.
    const result = processDx(
      _guiTextInput('email'),
      [
        _gslInputs({ override: { placeholder: 'From inputs' } }),
        _gslTextInputs({ override: { hint: 'From textInputs' } }),
      ],
    );
    const input = getStaticChild(result, 0) as {
      props?: { placeholder?: string; hint?: string };
    };

    expect(input.props?.placeholder).toBe('From inputs');
    expect(input.props?.hint).toBeUndefined();
  });

  it('_gslInputByUid overrides _gslInputs for the targeted widget', () => {
    const result = processDx(
      _guiTextInput('email', { uid: '#email' }),
      [
        _gslInputs({ override: { placeholder: 'Global' } }),
        _gslInputByUid('#email', { override: { placeholder: 'ById' } }),
      ],
    );
    const input = getStaticChild(result, 0) as {
      props?: { placeholder?: string };
    };

    expect(input.props?.placeholder).toBe('ById');
  });

  it('tag-scoped selector decorator does not apply when widget lacks the tag', () => {
    const result = processDx(
      _guiTextInput('name', {}, ['required']),
      [
        _gslInputs({ override: { placeholder: 'Global' } }),
        _gslTag('important', _gslInputs({ override: { placeholder: 'Tagged' } })),
      ],
    );
    const input = getStaticChild(result, 0) as {
      props?: { placeholder?: string };
    };

    // The input has no 'important' tag, so only the global should apply
    expect(input.props?.placeholder).toBe('Global');
  });

  it('tag-scoped selector overrides global when widget has the matching tag', () => {
    const taggedInputs = _guiTextInput('name');
    taggedInputs.tags = ['important'];

    const result = processDx(
      taggedInputs,
      [
        _gslInputs({ override: { placeholder: 'Global' } }),
        _gslTag('important', _gslInputs({ override: { placeholder: 'Tagged' } })),
      ],
    );
    const input = getStaticChild(result, 0) as {
      props?: { placeholder?: string };
    };

    // Both global and tag-scoped match; tag-scoped is later, so it wins
    expect(input.props?.placeholder).toBe('Tagged');
  });
});
