// Only the entry point this page uses, as an app imports it.
import '@golemui/gui-components/rating';
import '../shell';

const errorField = document.getElementById('rating-error');
if (errorField) Object.assign(errorField, { errors: ['Rate the service.'] });

document.getElementById('rating-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  const output = document.getElementById('rating-form-output');
  if (output) output.textContent = JSON.stringify(Object.fromEntries(data));
});
