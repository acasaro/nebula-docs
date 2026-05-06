import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import type { Root } from 'mdast';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter, ['yaml'])
  .use(remarkMdx);

/**
 * Parse MDX source text into an MDAST tree. The processor is configured with
 * GFM, YAML frontmatter, and MDX JSX support. The returned tree includes
 * frontmatter as the first node when present (use {@link extractFrontmatter}
 * to read its raw value).
 *
 * Both consumers (Platform editor at edit-time, CLI at build-time) parse via
 * this same function so they can't drift on dialect handling.
 */
export function parseMdx(source: string): Root {
  return processor.parse(source) as Root;
}

/**
 * Read the YAML frontmatter as a raw string. Caller passes to a YAML parser
 * if a structured value is needed. We deliberately don't parse here —
 * different surfaces want different shapes.
 */
export function extractFrontmatter(tree: Root): string | null {
  const first = tree.children[0];
  if (first?.type === 'yaml') return first.value;
  return null;
}
