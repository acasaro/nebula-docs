import type { ComponentType } from 'react';
import type { Block, BlockType } from '@mcoe/schemas';
import { HeadingEditor } from './HeadingEditor';
import { TextEditor } from './TextEditor';
import { CalloutEditor } from './CalloutEditor';
import { IconEditor } from './IconEditor';
import { FrameEditor } from './FrameEditor';
import { VideoEditor } from './VideoEditor';
import { StepEditor } from './StepEditor';
import { StepsEditor } from './StepsEditor';

export interface BlockEditorProps<B extends Block = Block> {
  block: B;
  onChange: (block: B) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  /**
   * Replace THIS block with a new block of the given type. Used by slash
   * commands typed inside text blocks ("/heading" → swap to a heading block).
   */
  onTypeChange?: (type: BlockType) => void;
  /**
   * Insert a new (empty text) block immediately after this one. Used when the
   * user presses Enter at the end of a text or heading block.
   */
  onInsertAfter?: () => void;
}

export type BlockEditorComponent<B extends Block = Block> = ComponentType<
  BlockEditorProps<B>
>;

type EditorRegistry = {
  [K in BlockType]: BlockEditorComponent<Extract<Block, { type: K }>>;
};

export const editorRegistry: EditorRegistry = {
  heading: HeadingEditor,
  text: TextEditor,
  callout: CalloutEditor,
  icon: IconEditor,
  frame: FrameEditor,
  video: VideoEditor,
  step: StepEditor,
  steps: StepsEditor,
};
