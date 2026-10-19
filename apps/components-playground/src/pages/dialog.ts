// Only the entry points this page uses, as an app imports them.
import '@golemui/gui-components/date-picker';
import '@golemui/gui-components/dialog';
import '@golemui/gui-components/dropdown';
import '@golemui/gui-components/textinput';
import '@golemui/gui-components/tooltip';
import '../shell';

// The form only shows what it would send.
document.getElementById('profile-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target as HTMLFormElement));
  document.dispatchEvent(new CustomEvent('gui-change', { detail: data }));
});
