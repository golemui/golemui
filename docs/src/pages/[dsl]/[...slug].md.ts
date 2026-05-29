import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { DSLS, type Dsl, toDslMarkdown } from '../../lib/doc-markdown';

/**
 * Serves single-DSL Markdown for every docs page at `/dx/<slug>.md` and
 * `/json/<slug>.md`, mirroring the site's `dx`/`json` locale URLs. Each file
 * contains only one DSL so LLMs never see the two encodings interleaved.
 */

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection('docs');
  return docs.flatMap((entry) =>
    DSLS.map((dsl) => ({
      params: { dsl, slug: entry.id },
      props: { entry, dsl },
    })),
  );
};

export const GET: APIRoute = ({ props }) => {
  const { entry, dsl } = props as { entry: Parameters<typeof toDslMarkdown>[0]; dsl: Dsl };
  return new Response(toDslMarkdown(entry, dsl), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
