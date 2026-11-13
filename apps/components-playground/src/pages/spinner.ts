// Only the entry point this page uses, as an app imports it.
import '@golemui/gui-components/spinner';
import type { GuiSpinner } from '@golemui/gui-components/spinner';
import '../shell';

const results = document.getElementById('results');
const spinner = document.getElementById('results-spinner') as GuiSpinner | null;
const output = document.getElementById('results-output');

document.getElementById('load')?.addEventListener('click', () => {
  if (!results || !spinner || !output) return;
  results.setAttribute('aria-busy', 'true');
  output.textContent = '';
  spinner.hidden = false;
  spinner.label = 'Loading results';
  setTimeout(() => {
    spinner.hidden = true;
    spinner.label = undefined;
    results.setAttribute('aria-busy', 'false');
    output.textContent = '12 results';
  }, 2000);
});
