import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * Generates `/llms.txt`: a flat index of every docs page following the
 * llmstxt.org convention. Each entry links to the programmatic (`dx`) raw
 * Markdown (`/dx/<slug>.md`) emitted by `[dsl]/[...slug].md.ts`. The JSON DSL
 * is available at the same path with the `/json/` prefix.
 */

const SITE_TITLE = 'GolemUI';
const SITE_SUMMARY = 'Declarative, serializable form engine. Docs in raw Markdown for LLMs.';

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/$/, '') ?? '';
  const docs = (await getCollection('docs')).sort((a: any, b: any) => a.id.localeCompare(b.id));

  const links = docs
    .map((entry: any) => {
      const url = `${base}/dx/${entry.id}.md`;
      const summary = entry.data.description ? `: ${entry.data.description}` : '';
      return `- [${entry.data.title}](${url})${summary}`;
    })
    .join('\n');

  const note =
    'Links use the programmatic (`dx`) DSL. For the JSON DSL, swap the `/dx/` ' +
    'prefix for `/json/` in any link below.';

  const body = `# ${SITE_TITLE}\n\n> ${SITE_SUMMARY}\n\n${note}\n\n## Docs\n\n${links}\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
