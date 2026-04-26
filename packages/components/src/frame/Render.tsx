import type { FrameBlock } from '@nebula/schemas';
import type { BlockComponentProps } from '../registry';
import { Frame } from './Frame';

export function FrameRender({ block, children }: BlockComponentProps<FrameBlock>) {
  return <Frame caption={block.props.caption}>{children}</Frame>;
}
