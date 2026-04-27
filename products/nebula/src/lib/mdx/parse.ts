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

export function parseMdx(source: string): Root {
  return processor.parse(source) as Root;
}

/**
 * Read the YAML frontmatter as a raw string. Caller can pass to a YAML
 * parser if needed. We deliberately don't parse here — different surfaces
 * may want different shapes.
 */
export function extractFrontmatter(tree: Root): string | null {
  const first = tree.children[0];
  if (first?.type === 'yaml') return first.value;
  return null;
}
