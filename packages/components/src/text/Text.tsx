import type { TextBlock } from '@nebula/schemas';
import { renderInline } from '../markdown';

export interface TextProps {
  block: TextBlock;
}

export function Text({ block }: TextProps) {
  return <p>{renderInline(block.props.markdown)}</p>;
}
