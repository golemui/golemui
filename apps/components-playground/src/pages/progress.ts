// Only the entry point this page uses, as an app imports it.
import '@golemui/gui-components/progress';
import type { GuiProgress } from '@golemui/gui-components/progress';
import '../shell';

// Indeterminate while it "connects", then counts up to 100.
const task = document.getElementById('task') as GuiProgress | null;
let timer: ReturnType<typeof setInterval> | undefined;

const reset = () => {
  clearInterval(timer);
  timer = undefined;
  if (task) task.value = undefined;
};

document.getElementById('task-start')?.addEventListener('click', () => {
  if (!task || timer) return;
  task.value = undefined;
  let value = 0;
  timer = setInterval(() => {
    value += 5;
    // The first second is spent connecting: no value yet.
    task.value = value <= 20 ? undefined : value - 20;
    if (value >= 120) {
      clearInterval(timer);
      timer = undefined;
    }
  }, 250);
});

document.getElementById('task-reset')?.addEventListener('click', reset);
