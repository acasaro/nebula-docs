import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Code2,
  Frame,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Info,
  Lightbulb,
  ListOrdered,
  List as ListUnordered,
  Minus,
  Newspaper,
  Quote,
  Square,
  StretchHorizontal,
  Type as TypeIcon,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

export interface SlashItem {
  id: string;
  label: string;
  description: string;
  Icon: typeof TypeIcon;
  keywords?: string[];
  command: (props: { editor: Editor; range: { from: number; to: number } }) => void;
}

export const SLASH_ITEMS: SlashItem[] = [
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Plain paragraph',
    Icon: TypeIcon,
    keywords: ['text', 'paragraph', 'p'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('paragraph').run();
    },
  },
  {
    id: 'heading-1',
    label: 'Heading 1',
    description: 'Large section heading',
    Icon: Heading1,
    keywords: ['h1', 'heading', 'title'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run();
    },
  },
  {
    id: 'heading-2',
    label: 'Heading 2',
    description: 'Medium section heading',
    Icon: Heading2,
    keywords: ['h2', 'heading', 'subtitle'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run();
    },
  },
  {
    id: 'heading-3',
    label: 'Heading 3',
    description: 'Small section heading',
    Icon: Heading3,
    keywords: ['h3', 'heading'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run();
    },
  },
  {
    id: 'bullet-list',
    label: 'Bullet list',
    description: 'Unordered list',
    Icon: ListUnordered,
    keywords: ['ul', 'unordered', 'list', 'bullet'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    id: 'ordered-list',
    label: 'Numbered list',
    description: 'Ordered list',
    Icon: ListOrdered,
    keywords: ['ol', 'ordered', 'numbered', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    id: 'blockquote',
    label: 'Quote',
    description: 'Quoted block of text',
    Icon: Quote,
    keywords: ['quote', 'blockquote'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal rule',
    Icon: Minus,
    keywords: ['hr', 'divider', 'line'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    id: 'code-block',
    label: 'Code block',
    description: 'Syntax-highlighted code',
    Icon: Code2,
    keywords: ['code', 'pre'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
  },
  {
    id: 'callout-note',
    label: 'Note',
    description: 'Blue callout',
    Icon: Info,
    keywords: ['callout', 'note', 'info'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxCallout',
          attrs: { variant: 'note' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'callout-tip',
    label: 'Tip',
    description: 'Green callout',
    Icon: Lightbulb,
    keywords: ['callout', 'tip'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxCallout',
          attrs: { variant: 'tip' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'callout-warning',
    label: 'Warning',
    description: 'Yellow callout',
    Icon: AlertTriangle,
    keywords: ['callout', 'warning'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxCallout',
          attrs: { variant: 'warning' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'callout-danger',
    label: 'Danger',
    description: 'Red callout',
    Icon: AlertOctagon,
    keywords: ['callout', 'danger', 'error'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxCallout',
          attrs: { variant: 'danger' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'callout-check',
    label: 'Check',
    description: 'Green check callout',
    Icon: CheckCircle,
    keywords: ['callout', 'check', 'success'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxCallout',
          attrs: { variant: 'check' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Boxed link card',
    Icon: Square,
    keywords: ['card'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxCard',
          attrs: { title: 'Card title' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'frame',
    label: 'Frame',
    description: 'Image with optional caption',
    Icon: Image,
    keywords: ['frame', 'image', 'figure'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxFrame',
          attrs: {},
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'update',
    label: 'Update',
    description: 'Changelog entry with date',
    Icon: Newspaper,
    keywords: ['update', 'changelog'],
    command: ({ editor, range }) => {
      const today = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxUpdate',
          attrs: { label: today },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'steps',
    label: 'Steps',
    description: 'Numbered step-by-step list',
    Icon: StretchHorizontal,
    keywords: ['steps', 'numbered', 'tutorial'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxSteps',
          attrs: {},
          content: [
            {
              type: 'mdxStep',
              attrs: {},
              content: [{ type: 'paragraph' }],
            },
          ],
        })
        .run();
    },
  },
  {
    id: 'frame-image',
    label: 'Image',
    description: 'Just an image (alias of Frame)',
    Icon: Frame,
    keywords: ['image', 'img', 'picture'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxFrame',
          attrs: {},
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
];

export function filterSlashItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => {
    if (item.label.toLowerCase().includes(q)) return true;
    if (item.description.toLowerCase().includes(q)) return true;
    if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
    return false;
  });
}
