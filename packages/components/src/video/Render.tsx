import type { VideoBlock } from '@nebula/schemas';
import type { BlockComponentProps } from '../registry';
import { Video } from './Video';

export function VideoRender({ block }: BlockComponentProps<VideoBlock>) {
  return (
    <Video
      src={block.props.src}
      caption={block.props.caption}
      loop={block.props.loop}
      maxLoops={block.props.maxLoops}
    />
  );
}
