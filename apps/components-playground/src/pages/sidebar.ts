// Only the entry points this page uses, as an app imports them.
import '@golemui/gui-components/menu';
import '@golemui/gui-components/sidebar';
import '../shell';

const range = document.getElementById('sidebar-width') as HTMLInputElement;
const value = document.getElementById('sidebar-width-value') as HTMLOutputElement;
const box = document.getElementById('sidebar-box') as HTMLElement;
const apply = () => {
  // The CSSOM, not a style attribute, as the playground's strict CSP asks.
  box.style.setProperty('inline-size', `${range.value}px`);
  box.style.setProperty('max-inline-size', '100%');
  value.value = range.value;
};
range.addEventListener('input', apply);
apply();
