// Only the entry point this page uses, as an app imports it.
import '@golemui/gui-components/otp';
import '../shell';

const errorField = document.getElementById('otp-error');
if (errorField) Object.assign(errorField, { errors: ['Enter all 6 digits.'] });

document.getElementById('otp-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  const output = document.getElementById('otp-form-output');
  if (output) output.textContent = JSON.stringify(Object.fromEntries(data));
});
