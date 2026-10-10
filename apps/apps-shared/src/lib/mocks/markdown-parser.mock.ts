import type { MarkdownParser, SanitizedHtml } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';

/**
 * Placeholder for an HTML sanitizer: it returns the HTML unchanged. The playgrounds only render
 * their own demo data and what you type, so they skip sanitizing.
 *
 * A real app must call a proper HTML sanitizer here. Snarkdown keeps raw HTML and `javascript:`
 * links, so markdown from users or stored data could run scripts in the page.
 */
function sanitizeHtmlPlaceholder(html: string): SanitizedHtml {
  return html as SanitizedHtml;
}

/** Playground `markdown` parser: Snarkdown, then the placeholder sanitizer. */
export const mockMarkdownParser: MarkdownParser = {
  parse: (markdown) => sanitizeHtmlPlaceholder(snarkdown(markdown)),
};
