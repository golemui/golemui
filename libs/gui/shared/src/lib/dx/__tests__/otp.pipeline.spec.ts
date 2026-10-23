import { describe, expect, it } from 'vitest';
import { _guiOtp, _gslOtps } from '../index';
import { getStaticChild, processDx } from './helpers';

type Widget = {
  kind?: string;
  type?: string;
  path?: string;
  label?: string;
  validator?: Record<string, unknown>;
  props?: Record<string, unknown>;
};

describe('DX Pipeline — OTP', () => {
  it('expands _guiOtp into an otp input, labelled from its path', () => {
    const w = getStaticChild(processDx(_guiOtp('verificationCode')), 0) as Widget;

    expect(w.kind).toBe('input');
    expect(w.type).toBe('otp');
    expect(w.path).toBe('verificationCode');
    expect(w.label).toBe('Verification Code');
  });

  it('passes its props, and types its validator as a string', () => {
    const w = getStaticChild(
      processDx(
        _guiOtp('code', {
          groups: [4, 4],
          validator: { required: true, exactLength: 8 },
        }),
      ),
      0,
    ) as Widget;

    expect(w.props).toMatchObject({ groups: [4, 4] });
    expect(w.validator).toEqual({ type: 'string', required: true, exactLength: 8 });
  });

  it('applies a GSL override', () => {
    const w = getStaticChild(
      processDx(_guiOtp('code'), [_gslOtps({ override: { groups: [3, 3] } })]),
      0,
    ) as Widget;

    expect(w.props?.['groups']).toEqual([3, 3]);
  });
});
