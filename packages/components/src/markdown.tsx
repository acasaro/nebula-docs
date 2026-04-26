import { Fragment, type ReactNode } from 'react';

type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; label: string };

export function parseInline(input: string): InlineNode[] {
  const out: InlineNode[] = [];
  let buffer = '';
  let i = 0;

  const flush = () => {
    if (buffer.length > 0) {
      out.push({ type: 'text', value: buffer });
      buffer = '';
    }
  };

  while (i < input.length) {
    const ch = input[i]!;

    if (ch === '*' && input[i + 1] === '*') {
      const end = input.indexOf('**', i + 2);
      if (end > -1) {
        flush();
        out.push({ type: 'bold', value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (ch === '*' || ch === '_') {
      const end = input.indexOf(ch, i + 1);
      if (end > -1) {
        flush();
        out.push({ type: 'italic', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (ch === '`') {
      const end = input.indexOf('`', i + 1);
      if (end > -1) {
        flush();
        out.push({ type: 'code', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (ch === '[') {
      const close = input.indexOf(']', i + 1);
      if (close > -1 && input[close + 1] === '(') {
        const paren = input.indexOf(')', close + 2);
        if (paren > -1) {
          flush();
          out.push({
            type: 'link',
            label: input.slice(i + 1, close),
            href: input.slice(close + 2, paren),
          });
          i = paren + 1;
          continue;
        }
      }
    }

    buffer += ch;
    i++;
  }

  flush();
  return out;
}

export function renderInline(input: string): ReactNode {
  return parseInline(input).map((node, idx) => {
    const key = idx;
    switch (node.type) {
      case 'text':
        return <Fragment key={key}>{node.value}</Fragment>;
      case 'bold':
        return <strong key={key}>{node.value}</strong>;
      case 'italic':
        return <em key={key}>{node.value}</em>;
      case 'code':
        return <code key={key}>{node.value}</code>;
      case 'link':
        return (
          <a key={key} href={node.href}>
            {node.label}
          </a>
        );
    }
  });
}
