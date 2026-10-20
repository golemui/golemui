// Only the entry points this page uses, as an app imports them.
import '@golemui/gui-components/dialog';
import { toast, type GuiToastHandle, type GuiToastVariant } from '@golemui/gui-components/toast';
import '../shell';

const on = (id: string, listener: () => void) =>
  document.getElementById(id)?.addEventListener('click', listener);

document.querySelectorAll<HTMLButtonElement>('[data-toast]').forEach((button) => {
  const variant = button.dataset['toast'] as GuiToastVariant;
  button.addEventListener('click', () =>
    toast({
      variant,
      message: `Variant ${variant}, sent at ${new Date().toLocaleTimeString()}.`,
    }),
  );
});

on('toast-undo', () =>
  toast({
    message: 'Invoice #1042 deleted.',
    action: { label: 'Undo', onAction: () => toast({ message: 'Invoice #1042 restored.' }) },
  }),
);

on('toast-title', () =>
  toast({
    title: 'Update available',
    message: 'Reload the page to get version 2.1.',
    variant: 'info',
  }),
);

let sent: GuiToastHandle[] = [];
on('toast-five', () => {
  sent = [1, 2, 3, 4, 5].map((n) => toast({ message: `Message ${n} of 5` }));
});
on('toast-dismiss-all', () => sent.forEach((handle) => handle.dismiss()));

on('toast-save', () => {
  toast({ id: 'save', message: 'Saving…', duration: Infinity });
  setTimeout(() => toast({ id: 'save', message: 'Saved.', variant: 'success' }), 1500);
});

document.getElementById('toast-placement')?.addEventListener('change', (event) => {
  const toaster = document.getElementById('toaster');
  toaster?.setAttribute('placement', (event.target as HTMLSelectElement).value);
});

on('toast-in-dialog', () =>
  toast({
    message: 'Post published.',
    variant: 'success',
    action: { label: 'View', onAction: () => toast({ message: 'Opening the post…' }) },
  }),
);
