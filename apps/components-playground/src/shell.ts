import { configureMessages, GUIAnchorController } from '@golemui/gui-components/internals';

/**
 * The playground's chrome, shared by every page: a toolbar for the foundations each element must
 * hold up against (theme, direction, translated strings, the overlays' measuring path), a log of
 * the `gui-*` events, and `data-pg-toggle` buttons that flip an element's `open` property. The
 * pages themselves stay plain HTML, as an app would write them.
 */

interface Settings {
  theme: 'light' | 'dark' | 'auto';
  dir: 'ltr' | 'rtl';
  strings: 'english' | 'pseudo';
  measuring: boolean;
}

const STORAGE_KEY = 'golemui-components-playground';
const defaults: Settings = { theme: 'auto', dir: 'ltr', strings: 'english', measuring: false };

function load(): Settings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return defaults;
  }
}

function save(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private windows can refuse storage: the settings then last until the page reloads.
  }
}

const accents: Record<string, string> = {
  a: 'à',
  e: 'é',
  i: 'î',
  o: 'ö',
  u: 'ü',
  c: 'ç',
  n: 'ñ',
  s: 'š',
  y: 'ý',
  A: 'À',
  E: 'É',
  I: 'Î',
  O: 'Ö',
  U: 'Ü',
  C: 'Ç',
  N: 'Ñ',
  S: 'Š',
  Y: 'Ý',
};

/**
 * Pseudo-translates a built-in string: accented, a third longer and bracketed, with its `{token}`s
 * left alone. A string that shows in plain English skipped `configureMessages`; one that overflows
 * its box won't survive a longer language.
 */
const pseudo = (text: string) => {
  const accented = text.replace(/\{\w+\}|[a-z]/gi, (part) => accents[part] ?? part);
  return `⟦${accented}${'·'.repeat(Math.ceil(text.length / 3))}⟧`;
};

function apply(settings: Settings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dir = settings.dir;
  configureMessages(settings.strings === 'pseudo' ? (_key, text) => pseudo(text) : null);
  // Read when an overlay opens: it applies to the next one.
  GUIAnchorController.forceFallback = settings.measuring;
}

function select<Key extends 'theme' | 'dir' | 'strings'>(
  settings: Settings,
  key: Key,
  label: string,
  options: Record<Settings[Key], string>,
) {
  const wrapper = document.createElement('label');
  const field = document.createElement('select');
  for (const [value, text] of Object.entries<string>(options)) {
    field.append(new Option(text, value, false, settings[key] === value));
  }
  field.addEventListener('change', () => {
    settings[key] = field.value as Settings[Key];
    save(settings);
    apply(settings);
  });
  wrapper.append(label, field);
  return wrapper;
}

function toolbar(settings: Settings) {
  const bar = document.createElement('header');
  bar.className = 'pg-toolbar';

  const home = document.createElement('a');
  home.className = 'pg-toolbar__home';
  home.href = '/';
  home.textContent = 'GolemUI Components playground';

  const measuring = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = settings.measuring;
  checkbox.addEventListener('change', () => {
    settings.measuring = checkbox.checked;
    save(settings);
    apply(settings);
  });
  measuring.append(checkbox, 'Overlays measure (no CSS anchor positioning)');

  bar.append(
    home,
    select(settings, 'theme', 'Theme', { light: 'Light', dark: 'Dark', auto: 'Auto' }),
    select(settings, 'dir', 'Direction', { ltr: 'Left to right', rtl: 'Right to left' }),
    select(settings, 'strings', 'Strings', { english: 'English', pseudo: 'Pseudo-translated' }),
    measuring,
  );
  return bar;
}

/** Logs the events the page lists in `data-pg-events` on its body. */
function eventLog() {
  const log = document.createElement('ol');
  log.className = 'pg-log';
  log.setAttribute('aria-label', 'Events');
  const names = (document.body.dataset.pgEvents ?? 'gui-toggle gui-change').split(/\s+/);
  for (const name of names) {
    document.addEventListener(name, (event) => {
      const target = event.target as HTMLElement;
      const entry = document.createElement('li');
      const detail = 'detail' in event ? JSON.stringify((event as CustomEvent).detail) : '';
      entry.textContent = `${event.type} ← ${target.localName}${target.id ? `#${target.id}` : ''} ${detail}`;
      log.prepend(entry);
      while (log.children.length > 20) log.lastElementChild?.remove();
    });
  }
  return log;
}

// A button that opens or closes an element from code: `data-pg-toggle="<the element's id>"`.
document.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLElement>('[data-pg-toggle]');
  const element = button && document.getElementById(button.dataset.pgToggle ?? '');
  if (element && 'open' in element) element.open = !element.open;
});

const settings = load();
apply(settings);
document.body.prepend(toolbar(settings));
document.body.append(eventLog());
