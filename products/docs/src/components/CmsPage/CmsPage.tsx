import { useMemo } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useLocation } from '@docusaurus/router';
import Layout from '@theme/Layout';
import DocRootLayout from '@theme/DocRoot/Layout';
import {
  DocsSidebarProvider,
  DocsVersionProvider,
} from '@docusaurus/plugin-content-docs/client';
import type {
  PropSidebar,
  PropSidebarItem,
} from '@docusaurus/plugin-content-docs';
import {
  useSubscribeToPageBySlug,
  useSubscribeToPublishedPages,
} from '@mcoe/firebase';
import { spaceIdSchema, type Page, type SpaceId } from '@mcoe/schemas';
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

function pagesToSidebar(pages: Page[]): PropSidebar {
  const byParent = new Map<string | null, Page[]>();
  for (const p of pages) {
    const list = byParent.get(p.parentId) ?? [];
    list.push(p);
    byParent.set(p.parentId, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sidebarOrder - b.sidebarOrder);
  }
  const itemsFor = (parentId: string | null): PropSidebarItem[] =>
    (byParent.get(parentId) ?? []).map((p) => {
      const children = itemsFor(p.id);
      const href = `/${p.spaceId}/${p.slug}`;
      if (children.length > 0) {
        return {
          type: 'category',
          label: p.title,
          items: children,
          href,
          collapsible: true,
          collapsed: false,
        };
      }
      return {
        type: 'link',
        label: p.title,
        href,
      };
    });
  return itemsFor(null);
}

export default function CmsPage() {
  return (
    <Layout>
      <BrowserOnly fallback={<CmsLoading />}>
        {() => <CmsPageContent />}
      </BrowserOnly>
    </Layout>
  );
}

function CmsPageContent() {
  const location = useLocation();
  const route = parseLocation(location.pathname);

  if (!route) {
    return <CmsNotFound message={`Unrecognized URL: ${location.pathname}`} />;
  }

  return <CmsRouteWithSidebar {...route} />;
}

function CmsRouteWithSidebar({ spaceId, slug }: RouteParts) {
  const sidebarState = useSubscribeToPublishedPages(spaceId);
  const sidebarItems = useMemo(
    () =>
      sidebarState.status === 'success'
        ? pagesToSidebar(sidebarState.pages)
        : undefined,
    [sidebarState]
  );

  return (
    <DocsVersionProvider version={null}>
      <DocsSidebarProvider name={spaceId} items={sidebarItems}>
        <DocRootLayout>
          <CmsPageBody spaceId={spaceId} slug={slug} />
        </DocRootLayout>
      </DocsSidebarProvider>
    </DocsVersionProvider>
  );
}

function CmsPageBody({ spaceId, slug }: RouteParts) {
  const state = useSubscribeToPageBySlug(spaceId, slug);

  if (state.status === 'loading') return <CmsLoading />;
  if (state.status === 'error') return <CmsError message={state.error.message} />;
  if (state.page === null) {
    return <CmsNotFound message={`No published page at /${spaceId}/${slug}`} />;
  }

  const { page } = state;

  return (
    <article>
      <h1>{page.title}</h1>
      <BlockRenderer blocks={page.publishedBlocks} />
    </article>
  );
}

function CmsLoading() {
  return <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>Loading…</p>;
}

function CmsNotFound({ message }: { message: string }) {
  return (
    <div>
      <h1>Page not found</h1>
      <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>{message}</p>
    </div>
  );
}

function CmsError({ message }: { message: string }) {
  return (
    <div>
      <h1>Error</h1>
      <pre style={{ color: 'var(--ifm-color-danger)' }}>{message}</pre>
    </div>
  );
}
