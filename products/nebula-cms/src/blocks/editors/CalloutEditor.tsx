import { Box, Stack } from '@mui/material';
import type { CalloutBlock, CalloutProps } from '@mcoe/schemas';
import { Icon } from '@mcoe/blocks';
import { resolveColor } from '@mcoe/theme';
import type { BlockEditorProps } from './registry';
import { EditableText } from '../primitives/EditableText';
import { BlockChrome } from '../primitives/BlockChrome';
import { BlockChildSlot } from '../primitives/BlockChildSlot';
import { CalloutEditForm } from '../edit-forms/CalloutEditForm';

const PRESETS: Record<
  Exclude<NonNullable<CalloutProps['variant']>, 'custom'>,
  { icon: string; color: string; label: string }
> = {
  note:    { icon: 'info',           color: 'info',    label: 'Note' },
  info:    { icon: 'lightbulb',      color: 'primary', label: 'Info' },
  tip:     { icon: 'emoji_objects',  color: 'success', label: 'Tip' },
  check:   { icon: 'check_circle',   color: 'success', label: 'Check' },
  warning: { icon: 'warning',        color: 'warning', label: 'Warning' },
  danger:  { icon: 'dangerous',      color: 'error',   label: 'Danger' },
};

export function CalloutEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps<CalloutBlock>) {
  const variant = block.props.variant ?? 'note';
  const preset = variant !== 'custom' ? PRESETS[variant] : null;
  const resolvedColor = resolveColor(
    block.props.color ?? preset?.color ?? 'info'
  );
  const resolvedTitle = block.props.title ?? preset?.label ?? '';

  const iconName = (block.props.icon as string | undefined) ?? preset?.icon;
  const iconElement = iconName ? (
    <Icon
      icon={iconName}
      size={18}
      color={block.props.color ?? preset?.color}
      iconLibrary={block.props.iconLibrary}
    />
  ) : null;

  return (
    <BlockChrome
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={isFirst}
      isLast={isLast}
      settings={<CalloutEditForm block={block} onChange={onChange} />}
    >
      <Box
        sx={{
          borderRadius: '12px',
          borderLeft: `4px solid ${resolvedColor}`,
          background: `color-mix(in srgb, ${resolvedColor} 8%, transparent)`,
          padding: '16px 20px',
          margin: '16px 0',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          {iconElement}
          <Box sx={{ flex: 1 }}>
            <EditableText
              value={resolvedTitle}
              onChange={(title) =>
                onChange({
                  ...block,
                  props: { ...block.props, title: title || undefined },
                })
              }
              placeholder={preset?.label ?? 'Title'}
              singleLine
              style={{
                fontSize: '14px',
                fontWeight: 650,
                color: resolvedColor,
              }}
              ariaLabel="Callout title"
            />
          </Box>
        </Stack>
        <Box sx={{ fontSize: '14px', lineHeight: 1.6 }}>
          <BlockChildSlot
            blocks={block.children}
            onChange={(children) => onChange({ ...block, children })}
            emptyHint="Type the callout's body — or press '/' for blocks"
          />
        </Box>
      </Box>
    </BlockChrome>
  );
}
