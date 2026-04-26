import { useRef } from 'react';
import styled from '@emotion/styled';

const Figure = styled.figure({
  margin: '16px 0',
  padding: 0,
});

const VideoWrapper = styled.div({
  borderRadius: '12px',
  border: '1px solid var(--mcoe-border-default)',
  overflow: 'hidden',
  background: 'var(--ifm-color-emphasis-100)',
  padding: '16px',
  '& video': {
    display: 'block',
    width: '100%',
    height: 'auto',
    borderRadius: '6px',
    margin: 0,
  },
});

const Caption = styled.figcaption({
  marginTop: '12px',
  marginBottom: '-4px',
  padding: '0 4px',
  fontSize: '13px',
  color: 'var(--ifm-color-emphasis-600)',
  textAlign: 'center',
});

export interface VideoNaturalProps {
  src: string;
  caption?: string;
  loop?: boolean;
  maxLoops?: number;
}

export function Video({ src, caption, loop = false, maxLoops = 4 }: VideoNaturalProps) {
  const loopCount = useRef(0);
  const totalLoops = loop ? maxLoops : 1;

  function handleEnded(e: React.SyntheticEvent<HTMLVideoElement>) {
    loopCount.current += 1;
    if (loopCount.current < totalLoops) {
      e.currentTarget.play();
    }
  }

  return (
    <Figure>
      <VideoWrapper>
        <video autoPlay muted playsInline onEnded={handleEnded}>
          <source src={src} type="video/mp4" />
        </video>
        {caption && <Caption>{caption}</Caption>}
      </VideoWrapper>
    </Figure>
  );
}

/** Legacy alias — match the existing MDX `<VideoLoop>` import name. */
export const VideoLoop = Video;
