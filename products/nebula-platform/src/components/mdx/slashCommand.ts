import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import { SlashMenu, type SlashMenuRef } from './SlashMenu';
import {
  buildSlashItems,
  filterSlashItems,
  type OpenMediaPicker,
  type SlashItem,
} from './slashItems';
import type { SnippetCatalogEntry } from '@/lib/mdx/snippetResolver';

import type { Editor } from '@tiptap/react';

interface SlashCommandOptions {
  /** Snapshot getter for the snippet catalog. Read fresh each time the
   *  menu opens so newly-fetched snippets show up without a remount. */
  getSnippetCatalog?: () => readonly SnippetCatalogEntry[];
  /** Asks the host to open the media picker. When omitted, the Image,
   *  Figure, and Video entries no-op (host is responsible for rendering
   *  the dialog). */
  openMediaPicker?: OpenMediaPicker;
}

interface SuggestionProps {
  editor: Editor;
  range: { from: number; to: number };
  query: string;
  items: SlashItem[];
  command: (item: SlashItem) => void;
  clientRect: (() => DOMRect | null) | null;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return { getSnippetCatalog: undefined, openMediaPicker: undefined };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }) => {
          const item = props as SlashItem;
          item.command({ editor, range });
        },
        items: ({ query }) => {
          const catalog = this.options.getSnippetCatalog?.() ?? [];
          return filterSlashItems(
            query,
            buildSlashItems(catalog, this.options.openMediaPicker),
          );
        },
        render: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let component: ReactRenderer<SlashMenuRef, any> | null = null;
          let popup: HTMLDivElement | null = null;

          const place = (props: SuggestionProps) => {
            const rect = props.clientRect?.();
            if (!popup || !rect) return;
            const top = rect.bottom + window.scrollY + 6;
            const left = rect.left + window.scrollX;
            popup.style.top = `${top}px`;
            popup.style.left = `${left}px`;
          };

          const cleanup = () => {
            popup?.remove();
            component?.destroy();
            popup = null;
            component = null;
          };

          return {
            onStart: (props) => {
              const typedProps = props as unknown as SuggestionProps;
              component = new ReactRenderer(SlashMenu, {
                props: typedProps,
                editor: typedProps.editor,
              });
              popup = document.createElement('div');
              popup.style.position = 'absolute';
              // Lower than dialogs (z-50) so the slash menu doesn't float on
              // top of the asset/media picker when an item like "Image" or
              // "Video" opens it. Still above editor block-handles + popovers
              // (z-30 / z-40) so it remains the primary affordance while open.
              popup.style.zIndex = '45';
              document.body.appendChild(popup);
              popup.appendChild(component.element);
              place(typedProps);
            },
            onUpdate: (props) => {
              const typedProps = props as unknown as SuggestionProps;
              component?.updateProps(typedProps);
              place(typedProps);
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                cleanup();
                return true;
              }
              return component?.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => {
              cleanup();
            },
          };
        },
      }),
    ];
  },
});
