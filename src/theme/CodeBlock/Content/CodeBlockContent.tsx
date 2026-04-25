import React from 'react';
import clsx from 'clsx';
import { useCodeBlockContext } from '@docusaurus/theme-common/internal';
import { Highlight, type PrismTheme } from 'prism-react-renderer';
import Line from '@theme/CodeBlock/Line';
import { useTheme } from '@site/src/theme/ThemeContext';
import { type ThemeTokens } from '@site/src/lib/tokens';
import styles from './styles.module.css';

function buildPrismTheme(tokens: ThemeTokens): PrismTheme {
  return {
    plain: {
      color: tokens.codePlainText,
      backgroundColor: tokens.codeBackground,
    },
    styles: [
      { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: tokens.codeComment, fontStyle: 'italic' as const } },
      { types: ['namespace'], style: { opacity: 0.7 } },
      { types: ['string', 'attr-value'], style: { color: tokens.codeString } },
      { types: ['punctuation', 'operator'], style: { color: tokens.codePunctuation } },
      { types: ['number', 'boolean', 'variable', 'constant', 'property', 'inserted'], style: { color: tokens.codeNumber } },
      { types: ['symbol', 'regex', 'url', 'entity'], style: { color: tokens.codeSymbol } },
      { types: ['keyword', 'atrule', 'attr-name', 'selector'], style: { color: tokens.codeKeyword } },
      { types: ['function', 'function-variable', 'deleted', 'tag'], style: { color: tokens.codeFunction } },
      { types: ['class-name', 'builtin'], style: { color: tokens.codeFunction } },
    ],
  };
}

const Pre = React.forwardRef<HTMLPreElement, React.HTMLAttributes<HTMLPreElement>>((props, ref) => (
  <pre ref={ref} tabIndex={0} {...props} className={clsx(props.className, styles.codeBlock, 'thin-scrollbar')} />
));

function Code(props: React.HTMLAttributes<HTMLElement>) {
  const { metadata } = useCodeBlockContext();
  return (
    <code
      {...props}
      className={clsx(
        props.className,
        styles.codeBlockLines,
        metadata.lineNumbersStart !== undefined && styles.codeBlockLinesWithNumbering,
      )}
      style={{
        ...props.style,
        counterReset: metadata.lineNumbersStart === undefined ? undefined : `line-count ${metadata.lineNumbersStart - 1}`,
      }}
    />
  );
}

export default function CodeBlockContent({ className: classNameProp }: { className?: string }) {
  const { metadata, wordWrap } = useCodeBlockContext();
  const { theme } = useTheme();
  const prismTheme = buildPrismTheme(theme);
  const { code, language, lineNumbersStart, lineClassNames } = metadata;

  return (
    <Highlight theme={prismTheme} code={code} language={language}>
      {({ className, style, tokens: lines, getLineProps, getTokenProps }) => (
        <Pre ref={wordWrap.codeBlockRef} className={clsx(classNameProp, className)} style={style}>
          <Code>
            {lines.map((line, i) => (
              <Line
                key={i}
                line={line}
                getLineProps={getLineProps}
                getTokenProps={getTokenProps}
                classNames={lineClassNames[i]}
                showLineNumbers={lineNumbersStart !== undefined}
              />
            ))}
          </Code>
        </Pre>
      )}
    </Highlight>
  );
}
