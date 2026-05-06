import type { Root } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { visit } from 'unist-util-visit';
import { Parser } from 'acorn';

/**
 * Map of JSX tag name → import source. The remark plugin walks every MDX
 * file (page or snippet) and prepends `import { Tag } from "<source>"`
 * statements for every tag whose name is a key in this map AND that isn't
 * already imported in the file. Mirrors Mintlify's auto-import behavior so
 * tenants don't have to write an import line per built-in component.
 *
 * Pass any additional component-name → source mappings (e.g. tenant-local
 * components) via the `extraComponents` option.
 */
export interface RemarkAutoComponentImportsOptions {
  /** The default component → source map. Required so the plugin can ship
   *  zero-config in `@astrojs/mdx`'s `remarkPlugins` array. */
  components: Record<string, string>;
  /** Optional extension; merges with `components` (these win on collision). */
  extraComponents?: Record<string, string>;
}

const DOTTED_ROOT_RE = /^([A-Za-z_$][\w$]*)\./;

/**
 * Parse an `import { Foo } from "bar";` statement into the estree the
 * MDX-to-JS compiler reads. The compiler looks at `mdxjsEsm.data.estree`
 * (a `Program` node) — without it, MDAST nodes we inject get serialized as
 * empty source. Acorn is the parser mdx-js itself uses, so the AST shape
 * matches.
 */
function parseImportToEstree(source: string): unknown {
  return Parser.parse(source, {
    sourceType: 'module',
    ecmaVersion: 'latest',
  });
}

/**
 * Walk the MDAST, collect every JSX tag name (including the root of dotted
 * names like `Tree.Folder` → `Tree`), and prepend missing import statements
 * grouped by source file. Skips lowercase tag names (they're intrinsic
 * HTML elements). Skips tags whose binding is already imported by the
 * file's existing `mdxjsEsm` nodes (so user-authored imports take
 * precedence and aren't duplicated).
 */
export function remarkAutoComponentImports(
  options: RemarkAutoComponentImportsOptions,
) {
  const map: Record<string, string> = {
    ...options.components,
    ...(options.extraComponents ?? {}),
  };

  return function transformer(tree: Root): void {
    const usedNames = new Set<string>();
    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node) => {
      const name = (node as MdxJsxFlowElement | MdxJsxTextElement).name;
      if (!name) return;
      // Lowercase = intrinsic HTML element. Skip.
      if (/^[a-z]/.test(name)) return;
      // Dotted access (`Tree.Folder`) needs the root binding only.
      const root = name.includes('.') ? (name.match(DOTTED_ROOT_RE)?.[1] ?? name) : name;
      usedNames.add(root);
    });

    // Collect already-imported names so we don't duplicate or shadow.
    const alreadyImported = new Set<string>();
    visit(tree, 'mdxjsEsm', (node) => {
      const value = (node as { value?: string }).value ?? '';
      // Conservative regex: one capture per `import ...` and `export const`.
      // This intentionally over-matches (e.g. namespace imports) to avoid
      // shadowing — better safe than emitting a duplicate.
      for (const m of value.matchAll(
        /import\s+(?:([A-Za-z_$][\w$]*)|(?:\{([^}]+)\})|(?:\*\s+as\s+([A-Za-z_$][\w$]*)))/g,
      )) {
        const def = m[1];
        const named = m[2];
        const ns = m[3];
        if (def) alreadyImported.add(def);
        if (ns) alreadyImported.add(ns);
        if (named) {
          for (const part of named.split(',')) {
            const t = part.trim();
            if (!t) continue;
            const asMatch = t.match(/^[A-Za-z_$][\w$]*\s+as\s+([A-Za-z_$][\w$]*)$/);
            if (asMatch) alreadyImported.add(asMatch[1]!);
            else if (/^[A-Za-z_$][\w$]*$/.test(t)) alreadyImported.add(t);
          }
        }
      }
    });

    // Group missing imports by source so we emit one statement per file.
    const bySource = new Map<string, Set<string>>();
    for (const name of usedNames) {
      if (alreadyImported.has(name)) continue;
      const source = map[name];
      if (!source) continue;
      let names = bySource.get(source);
      if (!names) {
        names = new Set();
        bySource.set(source, names);
      }
      names.add(name);
    }
    if (bySource.size === 0) return;

    const newImports: Array<{
      type: 'mdxjsEsm';
      value: string;
      data: { estree: ReturnType<typeof parseImportToEstree> };
    }> = [];
    for (const [source, names] of bySource) {
      const namedClause = Array.from(names).sort().join(', ');
      const value = `import { ${namedClause} } from "${source}";`;
      newImports.push({
        type: 'mdxjsEsm',
        value,
        // Critical: the MDX-to-JS compiler reads `data.estree`, NOT `value`.
        // A node with only `value` survives the MDAST stage but gets dropped
        // when the JS is emitted, so the import never lands in the bundle.
        data: { estree: parseImportToEstree(value) },
      });
    }

    // Insert AFTER any existing imports/exports so user-authored bindings
    // come first (and their resolution wins on shadow). If none exist,
    // prepend at the top of the file.
    let insertAt = 0;
    while (
      insertAt < tree.children.length &&
      tree.children[insertAt]?.type === 'mdxjsEsm'
    ) {
      insertAt++;
    }
    tree.children.splice(
      insertAt,
      0,
      ...(newImports as unknown as Root['children']),
    );
  };
}
