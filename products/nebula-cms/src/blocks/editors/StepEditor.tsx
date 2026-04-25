import { Box, Stack } from '@mui/material';
import type { StepBlock } from '@mcoe/schemas';
import { Icon } from '@mcoe/blocks';
import type { BlockEditorProps } from './registry';
import { EditableText } from '../primitives/EditableText';
import { BlockChrome } from '../primitives/BlockChrome';
import { BlockChildSlot } from '../primitives/BlockChildSlot';
import { StepEditForm } from '../edit-forms/StepEditForm';

export interface StepEditorProps extends BlockEditorProps<StepBlock> {
  /** Number to render in the indicator. Provided by StepsEditor when nested. */
  stepNumber?: number;
}

export function StepEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  stepNumber,
}: StepEditorProps) {
  const titleSize = block.props.titleSize ?? 'h3';
  const indicatorContent = block.props.icon ? (
    <Icon
      icon={block.props.icon}
      iconLibrary={block.props.iconLibrary}
      size={14}
    />
  ) : (
    stepNumber ?? '·'
  );

  return (
    <BlockChrome
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={isFirst}
      isLast={isLast}
      settings={<StepEditForm block={block} onChange={onChange} />}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Box
          sx={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--ifm-color-emphasis-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--ifm-font-color-base)',
          }}
        >
          {indicatorContent}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <EditableText
            value={block.props.title}
            onChange={(title) =>
              onChange({ ...block, props: { ...block.props, title } })
            }
            placeholder={`Step ${stepNumber ?? ''} title`}
            singleLine
            style={{
              fontSize: titleSize === 'p' ? '15px' : '16px',
              fontWeight: 600,
              lineHeight: 1.5,
              color: 'var(--ifm-font-color-base)',
            }}
            ariaLabel="Step title"
          />
          <Box
            sx={{
              mt: 1,
              fontSize: '14px',
              lineHeight: 1.7,
              color: 'var(--ifm-color-emphasis-700)',
            }}
          >
            <BlockChildSlot
              blocks={block.children}
              onChange={(children) => onChange({ ...block, children })}
              emptyHint="Start typing or press '/' for commands"
            />
          </Box>
        </Box>
      </Stack>
    </BlockChrome>
  );
}
