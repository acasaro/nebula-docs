import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const SLASH_HINT_KEY = new PluginKey('slashHint');

/**
 * Tiptap extension that shows ghost "Type to search" text after the slash
 * character when a paragraph contains exactly "/" with the cursor at the
 * end. Triggers in two scenarios:
 *   1. The user pressed "/" in any empty paragraph (slash menu just opened).
 *   2. The user clicked the "+" gutter button, which inserts a new paragraph
 *      pre-populated with "/" — without this hint they see only the floating
 *      menu and don't realize they can type to filter.
 *
 * The ghost text disappears the moment the user types one more character,
 * matching the slash-menu's filter contract.
 */
export const SlashHint = Extension.create({
  name: 'slashHint',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: SLASH_HINT_KEY,
        props: {
          decorations(state) {
            const { selection, doc } = state;
            // Only show when the cursor is collapsed (no range selection)
            // and sits at the end of a paragraph whose entire text is "/".
            if (!selection.empty) return DecorationSet.empty;
            const $from = selection.$from;
            const parent = $from.parent;
            if (parent.type.name !== 'paragraph') return DecorationSet.empty;
            if (parent.textContent !== '/') return DecorationSet.empty;
            // Cursor must be right after the "/" — anywhere else and the
            // hint would render in the wrong place visually.
            if ($from.parentOffset !== 1) return DecorationSet.empty;

            const widget = document.createElement('span');
            widget.className = 'mdx-slash-hint';
            widget.setAttribute('aria-hidden', 'true');
            widget.textContent = 'Type to search';

            return DecorationSet.create(doc, [
              Decoration.widget($from.pos, widget, {
                side: 1,
                ignoreSelection: true,
              }),
            ]);
          },
        },
      }),
    ];
  },
});
