/**
 * Tiny YAML frontmatter parser/serializer for MDX files.
 *
 * Scope is intentionally narrow: a leading `---` block delimited by `---`
 * with `key: value` pairs, scalar string/number/boolean values, and inline
 * arrays (`tags: [a, b, c]`). Multiline arrays / nested objects fall back
 * to passing the raw value through unchanged so we don't corrupt MDX we
 * can't fully model.
 */

export interface FrontmatterParsed {
  values: Record<string, unknown>;
  /** Original frontmatter block text (without the surrounding `---` lines). */
  raw: string;
  /** Length of the raw frontmatter block including delimiters and trailing newline. */
  length: number;
}

const DELIMITER = '---';

export function splitFrontmatter(source: string): {
  frontmatter: FrontmatterParsed | null;
  body: string;
} {
  if (!source.startsWith(`${DELIMITER}\n`) && !source.startsWith(`${DELIMITER}\r\n`)) {
    return { frontmatter: null, body: source };
  }
  const newlineLen = source.startsWith(`${DELIMITER}\r\n`) ? 2 : 1;
  const headerEnd = DELIMITER.length + newlineLen;
  const closeIdx = source.indexOf(`\n${DELIMITER}`, headerEnd);
  if (closeIdx < 0) {
    return { frontmatter: null, body: source };
  }
  const raw = source.slice(headerEnd, closeIdx);
  const after = closeIdx + 1 + DELIMITER.length;
  // Skip the newline after the closing delimiter, if present.
  let bodyStart = after;
  if (source[bodyStart] === '\r') bodyStart++;
  if (source[bodyStart] === '\n') bodyStart++;
  const body = source.slice(bodyStart);
  const values = parseScalars(raw);
  return {
    frontmatter: { values, raw, length: bodyStart },
    body,
  };
}

function parseScalars(raw: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon < 0) continue;
    const key = trimmed.slice(0, colon).trim();
    const valueRaw = trimmed.slice(colon + 1).trim();
    if (!key) continue;
    out[key] = parseScalarValue(valueRaw);
  }
  return out;
}

function parseScalarValue(raw: string): unknown {
  if (raw === '' || raw === '~' || raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((part) => parseScalarValue(part.trim()));
  }
  return raw;
}

/**
 * Serialize a values map back into a YAML frontmatter block. Round-tripping
 * a parsed frontmatter through this and `splitFrontmatter` should be stable
 * for the value types we actually parse.
 */
export function stringifyFrontmatter(values: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    lines.push(`${key}: ${stringifyScalar(value)}`);
  }
  return lines.join('\n');
}

function stringifyScalar(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stringifyArrayItem(v)).join(', ')}]`;
  }
  if (typeof value === 'string') {
    if (needsQuoting(value)) return JSON.stringify(value);
    return value;
  }
  return JSON.stringify(value);
}

function stringifyArrayItem(value: unknown): string {
  if (typeof value === 'string') {
    if (needsQuoting(value) || /[,\[\]\s]/.test(value)) return JSON.stringify(value);
    return value;
  }
  return stringifyScalar(value);
}

function needsQuoting(value: string): boolean {
  if (!value) return true;
  if (/^\s|\s$/.test(value)) return true;
  if (/[:#"'`\[\]{}]/.test(value)) return true;
  if (value === 'true' || value === 'false' || value === 'null') return true;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return true;
  return false;
}

/**
 * Apply a patch to a file's frontmatter, returning the new full source.
 * Adds a frontmatter block if the file didn't have one.
 */
export function applyFrontmatterPatch(
  source: string,
  patch: Record<string, unknown>,
): string {
  const split = splitFrontmatter(source);
  const baseValues = split.frontmatter?.values ?? {};
  const merged: Record<string, unknown> = { ...baseValues };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === '') {
      delete merged[k];
    } else {
      merged[k] = v;
    }
  }
  const body = split.frontmatter ? split.body : source;
  const yaml = stringifyFrontmatter(merged);
  if (!yaml.trim()) return body;
  return `${DELIMITER}\n${yaml}\n${DELIMITER}\n${body}`;
}
