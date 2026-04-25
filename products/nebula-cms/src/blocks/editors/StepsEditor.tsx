import { Box } from '@mui/material';
import type { StepBlock, StepsBlock } from '@mcoe/schemas';
import type { BlockEditorProps } from './registry';
import { BlockChrome } from '../primitives/BlockChrome';
import { BlockChildSlot } from '../primitives/BlockChildSlot';
import { StepEditor } from './StepEditor';
import { StepsEditForm } from '../edit-forms/StepsEditForm';

export function StepsEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps<StepsBlock>) {
  return (
    <BlockChrome
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={isFirst}
      isLast={isLast}
      settings={<StepsEditForm block={block} onChange={onChange} />}
    >
      <Box
        sx={{
          margin: '40px 0 24px 14px',
          position: 'relative',
        }}
      >
        <BlockChildSlot
          blocks={block.children}
          onChange={(children) => onChange({ ...block, children })}
          allowedTypes={['step']}
          emptyHint="Add a step to begin"
          renderBlock={(stepBlock, idx, handlers) => {
            // Block-children typing is generic; restrictTypes ensures we only
            // ever store step blocks here, but cast for the StepEditor prop.
            const step = stepBlock as StepBlock;
            return (
              <Box sx={{ position: 'relative', pb: 2.5 }}>
                <StepEditor
                  block={step}
                  stepNumber={idx + 1}
                  isFirst={handlers.isFirst}
                  isLast={handlers.isLast}
                  onChange={handlers.onChange as (b: StepBlock) => void}
                  onDelete={handlers.onDelete}
                  onMoveUp={handlers.onMoveUp}
                  onMoveDown={handlers.onMoveDown}
                />
              </Box>
            );
          }}
        />
      </Box>
    </BlockChrome>
  );
}
