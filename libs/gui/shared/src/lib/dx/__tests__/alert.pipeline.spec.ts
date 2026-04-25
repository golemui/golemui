import { describe, expect, it } from 'vitest';
import { _guiAlert, _gslAlerts, _gslAlertByUid } from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';

describe('DX Pipeline — Alert', () => {
  it('expands _guiAlert into a display alert widget', () => {
    const result = processDx(_guiAlert({ text: 'Warning message', level: 'warning' }));
    const w = getStaticChild(result, 0) as {
      kind?: string;
      type?: string;
      props?: { text?: string; level?: string };
    };

    expect(w.kind).toBe('display');
    expect(w.type).toBe('alert');
    expect(w.props?.text).toBe('Warning message');
    expect(w.props?.level).toBe('warning');
  });

  it('produces minimal widget when only text is provided', () => {
    const result = processDx(_guiAlert({ text: 'Hello' }));
    const w = getStaticChild(result, 0) as {
      kind?: string;
      type?: string;
      props?: { text?: string; level?: string };
    };

    expect(w.kind).toBe('display');
    expect(w.type).toBe('alert');
    expect(w.props?.text).toBe('Hello');
    expect(w.props?.level).toBeUndefined();
  });

  it('supports dynamic callback', () => {
    const result = processDx(
      _guiAlert(() => ({ text: 'Dynamic alert' })),
    );
    const raw = getRawChild(result, 0);
    const w = resolveDynamic(raw) as {
      kind?: string;
      type?: string;
      props?: { text?: string };
    };

    expect(w.kind).toBe('display');
    expect(w.type).toBe('alert');
    expect(w.props?.text).toBe('Dynamic alert');
  });

  it('applies GSL broad selector override', () => {
    const result = processDx(
      _guiAlert({ text: 'Original', level: 'info' }),
      [_gslAlerts({ override: { level: 'error' } })],
    );
    const w = getStaticChild(result, 0) as {
      props?: { level?: string };
    };

    expect(w.props?.level).toBe('error');
  });

  it('applies GSL byId selector override', () => {
    const result = processDx(
      _guiAlert({ text: 'With uid', uid: 'main-alert', level: 'info' }),
      [_gslAlertByUid('main-alert', { override: { level: 'success' } })],
    );
    const w = getStaticChild(result, 0) as {
      props?: { level?: string };
    };

    expect(w.props?.level).toBe('success');
  });
});
