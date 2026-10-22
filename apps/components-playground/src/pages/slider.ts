// Only the entry points this page uses, as an app imports them.
import '@golemui/gui-components/range-slider';
import '@golemui/gui-components/slider';
import '../shell';

// The props a page can't write as attributes: number formats and labelled marks.
const set = (id: string, props: Record<string, unknown>) =>
  Object.assign(document.getElementById(id) ?? {}, props);

set('opacity', { format: { style: 'percent' } });
set('rating', {
  marks: [
    { value: 1, label: 'Poor' },
    { value: 3, label: 'Fair' },
    { value: 5, label: 'Great' },
  ],
});
set('price', {
  format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
  value: { start: 100, end: 350 },
  marks: [0, 100, 200, 300, 400, 500],
});
set('hours', { format: { style: 'unit', unit: 'hour' }, value: { start: 9, end: 17 } });
set('discount', { format: { style: 'percent' }, maximum: 1, step: 0.05 });
set('budget', { format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } });

document.getElementById('slider-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  const output = document.getElementById('slider-form-output');
  if (output) output.textContent = JSON.stringify(Object.fromEntries(data));
});
