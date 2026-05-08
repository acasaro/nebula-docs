import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Code2,
  FileText,
  Film,
  Frame,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Columns2,
  FileCode,
  FolderTree,
  GitGraph,
  Image,
  Info,
  LayoutGrid,
  LayoutPanelLeft,
  LayoutPanelTop,
  Lightbulb,
  Maximize2,
  PanelTopOpen,
  Puzzle,
  ShieldCheck,
  Sliders,
  Tag as TagIcon,
  User as UserIcon,
  ListOrdered,
  List as ListUnordered,
  Minus,
  Newspaper,
  Table as TableIcon,
  Quote,
  Square,
  StretchHorizontal,
  Type as TypeIcon,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { SnippetCatalogEntry } from '@/lib/mdx/snippetResolver';

export interface SlashItem {
  id: string;
  label: string;
  description: string;
  Icon: typeof TypeIcon;
  keywords?: string[];
  command: (props: { editor: Editor; range: { from: number; to: number } }) => void;
}

/**
 * Asks the host (MdxEditor) to open the media picker. The host's onPick
 * callback is responsible for inserting the resulting node at `range`.
 * Mode picks both the asset filter (image vs video) and which Tiptap node
 * gets inserted on success.
 */
export interface MediaPickerRequest {
  mode: 'image' | 'figure' | 'video';
  editor: Editor;
  range: { from: number; to: number };
}

export type OpenMediaPicker = (req: MediaPickerRequest) => void;

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
    id: 'sheet',
    label: 'Sheet',
    description: 'Labeled content wrapper with left accent',
    Icon: LayoutPanelLeft,
    keywords: ['sheet', 'panel', 'wrapper', 'aside', 'highlight', 'section'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxSheet',
          attrs: { color: 'blue' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'feature-card',
    label: 'Feature card',
    description: 'Landing-page card with optional icon, pill, and CTA',
    Icon: LayoutPanelTop,
    keywords: ['feature', 'card', 'tile', 'landing', 'highlight'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxFeatureCard',
          attrs: {
            color: 'blue',
            accent: 'top-bar',
            layout: 'vertical',
            title: 'Feature title',
          },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'frame',
    label: 'Figure',
    description: 'Framed image with optional caption',
    Icon: Frame,
    keywords: ['frame', 'figure', 'image', 'caption'],
    command: () => {
      // Replaced at build-time by buildSlashItems when an image-picker is
      // wired. Without one, this no-ops — the editor host is responsible
      // for surfacing media UI.
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
    id: 'image',
    label: 'Image',
    description: 'Insert an image from your library or upload',
    Icon: Image,
    keywords: ['image', 'img', 'picture', 'media', 'photo', 'screenshot'],
    command: () => {
      // Same story as Figure — replaced by buildSlashItems when a media
      // picker is wired.
    },
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Insert a video from your library or upload',
    Icon: Film,
    keywords: ['video', 'mp4', 'movie', 'clip', 'media', 'loop'],
    command: () => {
      // Same story as Figure / Image — replaced by buildSlashItems when a
      // media picker is wired.
    },
  },
  {
    id: 'hero',
    label: 'Hero',
    description: 'Marketing banner with title, subtitle, and CTAs',
    Icon: Layers,
    keywords: ['hero', 'banner', 'landing', 'cta', 'jumbotron', 'splash'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxHero',
          attrs: {
            variant: 'banner',
            slides: [
              {
                title: 'Headline',
                description: 'Supporting copy beneath the title.',
              },
            ],
          },
        })
        .run();
    },
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Person tile — circular photo, name, and role',
    Icon: UserIcon,
    keywords: ['profile', 'person', 'team', 'member', 'avatar', 'headshot'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxProfile',
          attrs: { name: 'New profile' },
        })
        .run();
    },
  },
  {
    id: 'columns',
    label: 'Columns',
    description: 'Side-by-side content layout',
    Icon: Columns2,
    keywords: ['columns', 'column', 'grid', 'layout'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxColumns',
          attrs: { cols: 2 },
          content: [
            { type: 'mdxColumn', content: [{ type: 'paragraph' }] },
            { type: 'mdxColumn', content: [{ type: 'paragraph' }] },
          ],
        })
        .run();
    },
  },
  {
    id: 'card-group',
    label: 'Card group',
    description: 'Grid of cards',
    Icon: LayoutGrid,
    keywords: ['cards', 'group', 'grid', 'cardgroup'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxCardGroup',
          attrs: { cols: 2 },
          content: [
            {
              type: 'mdxCard',
              attrs: { title: 'Card title' },
              content: [{ type: 'paragraph' }],
            },
            {
              type: 'mdxCard',
              attrs: { title: 'Card title' },
              content: [{ type: 'paragraph' }],
            },
          ],
        })
        .run();
    },
  },
  {
    id: 'param-field',
    label: 'Param field',
    description: 'API request parameter',
    Icon: Sliders,
    keywords: ['param', 'parameter', 'api', 'field'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxParamField',
          attrs: { path: 'name', type: 'string' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'response-field',
    label: 'Response field',
    description: 'API response field',
    Icon: ShieldCheck,
    keywords: ['response', 'api', 'field'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxResponseField',
          attrs: { name: 'name', type: 'string' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'request-example',
    label: 'Request example',
    description: 'API request code sample',
    Icon: ArrowUpRight,
    keywords: ['request', 'example', 'api', 'sample'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxRequestExample',
          attrs: {},
          content: [
            {
              type: 'codeBlock',
              attrs: { language: 'bash' },
              content: [{ type: 'text', text: 'curl https://api.example.com' }],
            },
          ],
        })
        .run();
    },
  },
  {
    id: 'response-example',
    label: 'Response example',
    description: 'API response code sample',
    Icon: ArrowDownLeft,
    keywords: ['response', 'example', 'api', 'sample'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxResponseExample',
          attrs: {},
          content: [
            {
              type: 'codeBlock',
              attrs: { language: 'json' },
              content: [{ type: 'text', text: '{}' }],
            },
          ],
        })
        .run();
    },
  },
  {
    id: 'code-group',
    label: 'Code group',
    description: 'Tabbed sibling code blocks',
    Icon: FileCode,
    keywords: ['code', 'group', 'tabs', 'languages'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxCodeGroup',
          attrs: {},
          content: [
            {
              type: 'codeBlock',
              attrs: { language: 'javascript', filename: 'helloWorld.js' },
              content: [{ type: 'text', text: "console.log('Hello World');" }],
            },
            {
              type: 'codeBlock',
              attrs: { language: 'python', filename: 'hello_world.py' },
              content: [{ type: 'text', text: "print('Hello World!')" }],
            },
          ],
        })
        .run();
    },
  },
  {
    id: 'badge',
    label: 'Badge',
    description: 'Inline pill/tag label',
    Icon: TagIcon,
    keywords: ['badge', 'pill', 'tag', 'label'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxBadge',
          attrs: { label: 'Badge', color: 'gray' },
        })
        .run();
    },
  },
  {
    id: 'tooltip',
    label: 'Tooltip',
    description: 'Inline trigger with hover popup',
    Icon: HelpCircle,
    keywords: ['tooltip', 'hover', 'hint', 'popover'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxTooltip',
          attrs: {
            text: 'tooltip',
            title: 'Tooltip title',
            description: '',
            cta: null,
            href: null,
            side: 'top',
            align: 'center',
          },
        })
        .run();
    },
  },
  {
    id: 'mermaid',
    label: 'Mermaid diagram',
    description: 'Flowchart or graph',
    Icon: GitGraph,
    keywords: ['mermaid', 'diagram', 'flowchart', 'graph'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxMermaid',
          attrs: { chart: 'graph TD;\n  A-->B;' },
        })
        .run();
    },
  },
  {
    id: 'tree',
    label: 'File tree',
    description: 'Folder/file hierarchy diagram',
    Icon: FolderTree,
    keywords: ['tree', 'file', 'folder', 'hierarchy'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxTree',
          content: [
            {
              type: 'mdxTreeFolder',
              attrs: { name: 'src' },
              content: [
                { type: 'mdxTreeFile', attrs: { name: 'index.ts' } },
              ],
            },
          ],
        })
        .run();
    },
  },
  {
    id: 'expandable',
    label: 'Expandable',
    description: 'Show/hide content section',
    Icon: Maximize2,
    keywords: ['expandable', 'collapse', 'show', 'hide'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxExpandable',
          attrs: { title: 'details' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'accordion',
    label: 'Accordion',
    description: 'Collapsible disclosure',
    Icon: PanelTopOpen,
    keywords: ['accordion', 'disclosure', 'collapse', 'expand'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxAccordion',
          attrs: { title: 'Accordion title' },
          content: [{ type: 'paragraph' }],
        })
        .run();
    },
  },
  {
    id: 'tabs',
    label: 'Tabs',
    description: 'Switchable content panels',
    Icon: LayoutPanelTop,
    keywords: ['tabs', 'tab'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'mdxTabs',
          attrs: {},
          content: [
            {
              type: 'mdxTab',
              attrs: { title: 'First tab' },
              content: [{ type: 'paragraph' }],
            },
            {
              type: 'mdxTab',
              attrs: { title: 'Second tab' },
              content: [{ type: 'paragraph' }],
            },
          ],
        })
        .run();
    },
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Markdown table with header + 2 rows',
    Icon: TableIcon,
    keywords: ['table', 'grid', 'rows', 'columns'],
    command: ({ editor, range }) => {
      // 3 cols × header + 2 body rows. Matches Mintlify's default shape.
      // GFM column alignment defaults to null (= left) on every cell.
      const headerCell = {
        type: 'tableHeader',
        attrs: { align: null },
        content: [{ type: 'paragraph' }],
      };
      const bodyCell = {
        type: 'tableCell',
        attrs: { align: null },
        content: [{ type: 'paragraph' }],
      };
      const headerRow = {
        type: 'tableRow',
        content: [headerCell, headerCell, headerCell],
      };
      const bodyRow = {
        type: 'tableRow',
        content: [bodyCell, bodyCell, bodyCell],
      };
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'table',
          content: [headerRow, bodyRow, bodyRow],
        })
        .run();
    },
  },
];

/**
 * Build the slash menu's full item list including one entry per available
 * snippet (Mintlify-style import-and-render). Snippet items appear after
 * the static block items so typing `/snip` surfaces them, and typing the
 * snippet's filename (`/disclaimer`) finds them directly.
 */
export function buildSlashItems(
  catalog: readonly SnippetCatalogEntry[],
  openMediaPicker?: OpenMediaPicker,
): SlashItem[] {
  const snippetItems: SlashItem[] = catalog.map((entry) => ({
    id: `snippet:${entry.importPath}`,
    label: entry.defaultBinding,
    description: entry.isReact
      ? `React component snippet — ${entry.importPath}`
      : `Reusable snippet — ${entry.importPath}`,
    Icon: entry.isReact ? Puzzle : FileText,
    keywords: ['snippet', 'include', entry.defaultBinding.toLowerCase(), entry.importPath],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertImportedSnippet({
          binding: entry.defaultBinding,
          path: entry.importPath,
          isReact: entry.isReact,
        })
        .run();
    },
  }));
  const items: SlashItem[] = openMediaPicker
    ? SLASH_ITEMS.map((item) => {
        if (item.id === 'image') {
          return {
            ...item,
            command: ({ editor, range }: { editor: Editor; range: { from: number; to: number } }) =>
              openMediaPicker({ mode: 'image', editor, range }),
          };
        }
        if (item.id === 'frame') {
          return {
            ...item,
            command: ({ editor, range }: { editor: Editor; range: { from: number; to: number } }) =>
              openMediaPicker({ mode: 'figure', editor, range }),
          };
        }
        if (item.id === 'video') {
          return {
            ...item,
            command: ({ editor, range }: { editor: Editor; range: { from: number; to: number } }) =>
              openMediaPicker({ mode: 'video', editor, range }),
          };
        }
        return item;
      })
    : SLASH_ITEMS;
  return [...items, ...snippetItems];
}

export function filterSlashItems(
  query: string,
  items: SlashItem[] = SLASH_ITEMS,
): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    if (item.label.toLowerCase().includes(q)) return true;
    if (item.description.toLowerCase().includes(q)) return true;
    if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
    return false;
  });
}
