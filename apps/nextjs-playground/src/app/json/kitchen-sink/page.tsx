import KitchenSinkJsonClient from './kitchen-sink-client';

// Opt this route out of static prerendering so `next start` exercises
// request-time SSR (the other pages validate build-time prerender).
// Segment config only works in a server component file, hence this thin
// wrapper around the 'use client' page implementation.
export const dynamic = 'force-dynamic';

export default function KitchenSinkJsonPage() {
  return <KitchenSinkJsonClient />;
}
