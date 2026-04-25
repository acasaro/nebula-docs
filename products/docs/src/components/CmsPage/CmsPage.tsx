import BrowserOnly from '@docusaurus/BrowserOnly';
import { useLocation } from '@docusaurus/router';
import Layout from '@theme/Layout';
import { useSubscribeToPageBySlug } from '@mcoe/firebase';
import { spaceIdSchema, type SpaceId } from '@mcoe/schemas';
import { BlockRenderer } from '@mcoe/renderer';

interface RouteParts {
  spaceId: SpaceId;
  slug: string;
}

function parseLocation(pathname: string): RouteParts | null {
  const match = pathname.match(/^\/([^/]+)\/(.+?)\/?$/);
  if (!match) return null;
  const [, rawSpace, slug] = match;
  const parsed = spaceIdSchema.safeParse(rawSpace);
  if (!parsed.success || !slug) return null;
  return { spaceId: parsed.data, slug };
}

export default function CmsPage() {
  return (
    <Layout>
      <BrowserOnly fallback={<CmsLoading />}>{() => <CmsPageContent />}</BrowserOnly>
    </Layout>
  );
}

function CmsPageContent() {
  const location = useLocation();
  const route = parseLocation(location.pathname);

  if (!route) {
    return <CmsNotFound message={`Unrecognized URL: ${location.pathname}`} />;
  }

  return <CmsPageBody spaceId={route.spaceId} slug={route.slug} />;
}

function CmsPageBody({ spaceId, slug }: RouteParts) {
  const state = useSubscribeToPageBySlug(spaceId, slug);

  if (state.status === 'loading') return <CmsLoading />;
  if (state.status === 'error') {
    return <CmsError message={state.error.message} />;
  }
  if (state.page === null) {
    return <CmsNotFound message={`No published page at /${spaceId}/${slug}`} />;
  }

  const { page } = state;

  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px' }}>
      <h1>{page.title}</h1>
      <BlockRenderer blocks={page.publishedBlocks} />
    </main>
  );
}

function CmsLoading() {
  return (
    <main style={{ padding: 32, color: '#666' }}>Loading…</main>
  );
}

function CmsNotFound({ message }: { message: string }) {
  return (
    <main style={{ padding: 32 }}>
      <h1>Page not found</h1>
      <p style={{ color: '#666' }}>{message}</p>
    </main>
  );
}

function CmsError({ message }: { message: string }) {
  return (
    <main style={{ padding: 32 }}>
      <h1>Error</h1>
      <pre style={{ color: '#b00020' }}>{message}</pre>
    </main>
  );
}
