// Only the entry point this page uses, as an app imports it: the classes need none.
import '@golemui/gui-components/markdown-text';
import '../shell';

// A stand-in for the app's Markdown parser: the page only needs the markup it would give.
const parser = {
  parse: () => '<h2>Your booking</h2><p>Two nights in a double room.</p>',
};

Object.assign(document.getElementById('markdown') ?? {}, {
  md: '## Your booking\n\nTwo nights in a double room.',
  dependencies: { markdown: parser },
});
