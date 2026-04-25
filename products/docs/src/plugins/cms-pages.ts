import type { LoadContext, Plugin } from '@docusaurus/types';

export interface CmsPagesOptions {
  spaces: readonly string[];
}

/**
 * Registers a wildcard route per CMS-served space (e.g. `/developers/*`).
 * Routes that already exist (MDX content from plugin-content-docs) take
 * precedence; unmatched URLs under each space prefix fall through to
 * <CmsPage>, which fetches from Firestore at runtime and renders via
 * @mcoe/renderer.
 */
export default function cmsPagesPlugin(
  _context: LoadContext,
  options: CmsPagesOptions
): Plugin<void> {
  return {
    name: 'cms-pages',
    async contentLoaded({ actions }) {
      for (const spaceId of options.spaces) {
        actions.addRoute({
          path: `/${spaceId}/:cmsPath*`,
          component: '@site/src/components/CmsPage',
          exact: false,
        });
      }
    },
  };
}
