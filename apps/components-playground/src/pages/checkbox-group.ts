// Only the entry point this page uses, as an app imports it.
import '@golemui/gui-components/checkbox-group';
import '../shell';

const toppings = [
  { label: 'Cheese', value: 'cheese' },
  { label: 'Ham', value: 'ham' },
  { label: 'Olives', value: 'olives' },
  { label: 'Mushrooms', value: 'mushrooms' },
];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const set = (id: string, props: Record<string, unknown>) => {
  const element = document.getElementById(id);
  if (element) Object.assign(element, props);
};

set('toppings', { options: toppings, values: ['ham'] });
set('days', { options: days });
set('readonly', { options: toppings, values: ['cheese', 'olives'] });
set('disabled', { options: toppings, values: ['ham'] });
set('errors', { options: toppings, errors: ['Pick at most two.'] });
set('form-group', { options: toppings });

document.getElementById('group-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  const output = document.getElementById('group-form-output');
  if (output) output.textContent = JSON.stringify(data.getAll('toppings'));
});
