import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  configureMessages,
  DEFAULT_MESSAGES,
  message,
  optionalName,
  requiredName,
  trackMessages,
} from './messages';

describe('message', () => {
  afterEach(() => configureMessages(null));

  it('falls back to the English default', () => {
    expect(message('showCalendar')).toBe('Show calendar');
  });

  it('uses the translate function, with the key, the default and the params', () => {
    const translate = vi.fn(() => 'Mostrar calendario');
    configureMessages(translate);

    expect(message('showCalendar')).toBe('Mostrar calendario');
    expect(translate).toHaveBeenCalledWith(
      'showCalendar',
      DEFAULT_MESSAGES.showCalendar,
      undefined,
    );
  });

  it('falls back to the default when the translate function has no translation', () => {
    configureMessages(() => undefined);

    expect(message('showCalendar')).toBe('Show calendar');
  });

  it("prefers the element's own prop over any translation", () => {
    configureMessages(() => 'Mostrar calendario');

    expect(message('showCalendar', 'Open')).toBe('Open');
  });

  it('fills in the tokens of the default, a translation and an override', () => {
    expect(message('rangeUnderflow', undefined, { min: 18 })).toBe(
      'Value must be greater than or equal to 18.',
    );
    expect(message('removeFile', 'Quitar {name}', { name: 'cv.pdf' })).toBe('Quitar cv.pdf');

    configureMessages(() => 'Mínimo {min}');
    expect(message('rangeUnderflow', undefined, { min: 18 })).toBe('Mínimo 18');
  });

  it('leaves a token the translate function already filled in alone', () => {
    configureMessages((_key, _default, params) => `${params?.['count']} elementos`);

    expect(message('itemCount', undefined, { count: 3 })).toBe('3 elementos');
  });

  it('picks the English plural form by count', () => {
    expect(message('itemCount', undefined, { count: 1 })).toBe('1 item');
    expect(message('itemCount', undefined, { count: 3 })).toBe('3 items');
  });

  it('passes the translate function the English form for the count', () => {
    const translate = vi.fn(() => undefined);
    configureMessages(translate);

    message('tagCount', undefined, { count: 1 });
    expect(translate).toHaveBeenCalledWith('tagCount', '{count} tag', { count: 1 });
  });

  it('re-renders the connected elements when the translate function changes', () => {
    const element = { requestUpdate: vi.fn() };
    trackMessages(element, true);

    configureMessages(() => 'x');
    expect(element.requestUpdate).toHaveBeenCalledTimes(1);

    trackMessages(element, false);
    configureMessages(null);
    expect(element.requestUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('requiredName', () => {
  afterEach(() => configureMessages(null));

  it('falls back to the default for an empty override or translation', () => {
    expect(requiredName('nextMonth', '')).toBe('Next month');

    configureMessages(() => '');
    expect(requiredName('nextMonth')).toBe('Next month');
  });

  it('prefers the override, then the translation', () => {
    configureMessages(() => 'Mes siguiente');

    expect(requiredName('nextMonth')).toBe('Mes siguiente');
    expect(requiredName('nextMonth', 'Forward')).toBe('Forward');
  });
});

describe('optionalName', () => {
  it('removes the name for an empty override', () => {
    expect(optionalName('startDate', '')).toBeUndefined();
  });

  it('keeps the default otherwise', () => {
    expect(optionalName('startDate')).toBe('Start date');
    expect(optionalName('startDate', 'From')).toBe('From');
  });
});
