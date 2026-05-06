import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdx';
import { visit } from 'unist-util-visit';

/**
 * One imported binding pulled out of an MDX `mdxjsEsm` node. We split mixed
 * import statements (default + named, or multiple named) into one spec per
 * binding so the serializer can ungroup-then-regroup them deterministically.
 */
export type ImportSpec =
  | {
      kind: 'default';
      /** Local name in this file. Same as the source name for default. */
      binding: string;
      /** Repo-relative or `/`-rooted snippet path verbatim from the import. */
      path: string;
    }
  | {
      kind: 'named';
      /** Local name in this file. */
      binding: string;
      /** Original export name (different from binding when `as` is used). */
      source: string;
      path: string;
    }
  | {
      kind: 'namespace';
      binding: string;
      path: string;
    };

/**
 * One `export const FOO = "value";` declaration pulled out of an `mdxjsEsm`
 * node. Used by the variable-substitution pass when a snippet is imported as
 * a named binding.
 */
export interface ExportConstSpec {
  name: string;
  /** Raw expression source, e.g. `"value"` or `42` or `[1, 2]`. The
   *  resolver evaluates string/number literals; expressions are passed
   *  through verbatim for the renderer to interpret. */
  rawValue: string;
}

const IMPORT_RE =
  /^\s*import\s+(?:([A-Za-z_$][\w$]*)(?:\s*,\s*\{([^}]*)\})?|\{([^}]*)\}|\*\s+as\s+([A-Za-z_$][\w$]*))\s+from\s+(['"])([^'"]+)\5\s*;?\s*$/;

const EXPORT_CONST_RE =
  /^\s*export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+?)\s*;?\s*$/;

/**
 * Parse a single ES module statement source string. Returns [] for anything
 * that isn't an `import` (multi-statement values are split on `;` first by
 * the caller — `mdxjsEsm` typically holds one statement per node).
 */
export function parseImportStatement(source: string): ImportSpec[] {
  const m = source.trim().match(IMPORT_RE);
  if (!m) return [];
  const defaultName = m[1];
  const namedAfterDefault = m[2];
  const namedOnly = m[3];
  const namespaceName = m[4];
  const path = m[6]!;

  if (namespaceName) {
    return [{ kind: 'namespace', binding: namespaceName, path }];
  }

  const out: ImportSpec[] = [];
  if (defaultName) {
    out.push({ kind: 'default', binding: defaultName, path });
  }
  const namedClause = namedAfterDefault ?? namedOnly;
  if (namedClause) {
    for (const part of namedClause.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const asMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
      if (asMatch) {
        out.push({
          kind: 'named',
          binding: asMatch[2]!,
          source: asMatch[1]!,
          path,
        });
      } else if (/^[A-Za-z_$][\w$]*$/.test(trimmed)) {
        out.push({ kind: 'named', binding: trimmed, source: trimmed, path });
      }
    }
  }
  return out;
}

/**
 * Parse a single `export const NAME = VALUE;` statement. Returns null for
 * anything else. Multi-declaration `export const a = 1, b = 2;` is rare in
 * MDX practice and not supported.
 */
export function parseExportConst(source: string): ExportConstSpec | null {
  const m = source.trim().match(EXPORT_CONST_RE);
  if (!m) return null;
  return { name: m[1]!, rawValue: m[2]! };
}

/**
 * Walk an MDAST tree and extract every `import` declaration as a flat list
 * of `ImportSpec`. Mixed imports (`import D, { x } from "..."`) split into
 * multiple specs sharing a path.
 */
export function extractImports(tree: Root): ImportSpec[] {
  const out: ImportSpec[] = [];
  visit(tree, 'mdxjsEsm', (node: MdxjsEsm) => {
    // mdxjsEsm.value can hold multiple statements separated by semicolons;
    // split conservatively (a string with `;` inside an import path would be
    // invalid syntax anyway).
    for (const stmt of splitStatements(node.value ?? '')) {
      out.push(...parseImportStatement(stmt));
    }
  });
  return out;
}

/**
 * Walk an MDAST tree and extract every `export const NAME = ...` statement.
 * Used by snippet files that act as variable libraries.
 */
export function extractExports(tree: Root): ExportConstSpec[] {
  const out: ExportConstSpec[] = [];
  visit(tree, 'mdxjsEsm', (node: MdxjsEsm) => {
    for (const stmt of splitStatements(node.value ?? '')) {
      const exp = parseExportConst(stmt);
      if (exp) out.push(exp);
    }
  });
  return out;
}

function splitStatements(value: string): string[] {
  // Naive split — fine because import/export const statements don't contain
  // unescaped semicolons inside their literal forms in practice. Trim empty
  // tail from a trailing semicolon.
  return value
    .split(/;\s*\n|;$/m)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Group import specs by path so the serializer can emit one statement per
 * source file ("import D, { x, y } from '/path';"). Default + named for the
 * same path coalesce; namespace stays standalone.
 */
export function groupImportsByPath(
  specs: readonly ImportSpec[],
): Array<{
  path: string;
  defaultBinding?: string;
  named: Array<{ binding: string; source: string }>;
  namespace?: string;
}> {
  const byPath = new Map<
    string,
    {
      path: string;
      defaultBinding?: string;
      named: Array<{ binding: string; source: string }>;
      namespace?: string;
    }
  >();
  for (const spec of specs) {
    let entry = byPath.get(spec.path);
    if (!entry) {
      entry = { path: spec.path, named: [] };
      byPath.set(spec.path, entry);
    }
    if (spec.kind === 'default') entry.defaultBinding = spec.binding;
    else if (spec.kind === 'named') {
      entry.named.push({ binding: spec.binding, source: spec.source });
    } else entry.namespace = spec.binding;
  }
  return Array.from(byPath.values());
}

/**
 * Render a list of grouped imports back to MDX source. Used by the editor's
 * serializer to prepend imports after frontmatter.
 */
export function serializeImports(specs: readonly ImportSpec[]): string {
  const groups = groupImportsByPath(specs);
  const lines: string[] = [];
  for (const g of groups) {
    if (g.namespace) {
      lines.push(`import * as ${g.namespace} from "${g.path}";`);
      continue;
    }
    const parts: string[] = [];
    if (g.defaultBinding) parts.push(g.defaultBinding);
    if (g.named.length) {
      const named = g.named
        .map((n) => (n.binding === n.source ? n.binding : `${n.source} as ${n.binding}`))
        .join(', ');
      parts.push(`{ ${named} }`);
    }
    if (parts.length === 0) continue;
    lines.push(`import ${parts.join(', ')} from "${g.path}";`);
  }
  return lines.join('\n');
}

/**
 * Derive a default PascalCase binding name from a snippet file path.
 * `disclaimer.mdx` → `Disclaimer`. `nebula-banner.mdx` → `NebulaBanner`.
 * Used by the slash-command picker so users don't have to think up names.
 */
export function bindingNameFromPath(path: string): string {
  const base = path.split('/').pop() ?? path;
  const stem = base.replace(/\.[^.]+$/, '');
  return stem
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('') || 'Snippet';
}
