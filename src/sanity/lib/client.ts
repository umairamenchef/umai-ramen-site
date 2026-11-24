import { createClient, type QueryParams } from 'next-sanity';
import { projectId, dataset, apiVersion } from '../env';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Origin API, not the API CDN (Phase 15, Phase 13 deferred item 3). Every site fetch is
  // tagged and kept by Next until revalidateTag, so Sanity is only queried at build, on a
  // cold cache or right after a revalidation. Through the API CDN, a revalidation in the
  // 86–111 s after a write re-cached the OLD content (measured live in 13-03).
  useCdn: false,
});

export async function sanityFetch<const Q extends string>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
}: {
  query: Q;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}) {
  return client.fetch(query, params, {
    cache: 'force-cache',
    next: {
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  });
}
