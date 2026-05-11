type DocsTheme = 'light' | 'dark';

const applyTheme = (theme: DocsTheme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.dataset['theme'] = theme;
  root.style.colorScheme = theme;
};

export const iframeThemeSync = () => {
  if (typeof window === 'undefined') return;

  const initial: DocsTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  applyTheme(initial);

  if (window.parent === window) return;

  window.addEventListener('message', (event) => {
    const data = event.data as { type?: string; theme?: DocsTheme } | null;
    if (data?.type === 'golemui-theme' && (data.theme === 'dark' || data.theme === 'light')) {
      applyTheme(data.theme);
    }
  });

  window.parent.postMessage({ type: 'golemui-theme-ready' }, '*');
};
