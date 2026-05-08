import { useRef } from 'react';
import styled from '@emotion/styled';

const Figure = styled.figure({
  // Centered with a constrained default width. 40rem (640px) keeps the
  // video from dominating the ~880px content column while still being
  // large enough to read product UI captures. Tenants can override
  // per-instance via inline styles or a wrapping <Frame>.
  margin: '16px auto',
  padding: 0,
  maxWidth: '40rem',
  width: '100%',
});

const VideoWrapper = styled.div({
  borderRadius: '12px',
  // Each var() carries a literal fallback so the same component renders
  // both in the Docusaurus docs site (where `--mcoe-*` / `--ifm-*` resolve
  // to the legacy tokens) and in the standalone CLI render path (where
  // they're undefined — the fallback paints a neutral surface).
  border: '1px solid var(--mcoe-border-default, rgba(0, 0, 0, 0.08))',
  overflow: 'hidden',
  background: 'var(--ifm-color-emphasis-100, #f4f4f5)',
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
  color: 'var(--ifm-color-emphasis-600, #6d6f70)',
  textAlign: 'center',
});

export interface VideoProps {
  src: string;
  caption?: string;
  /** When true, replays the clip after `ended` up to `maxLoops` times. */
  loop?: boolean;
  /** Bound on the loop count. Required for loop to do anything. */
  maxLoops?: number;
}

export function Video({ src, caption, loop = false, maxLoops = 4 }: VideoProps) {
  const loopCount = useRef(0);
  const totalLoops = loop ? maxLoops : 1;

  function handleEnded(e: React.SyntheticEvent<HTMLVideoElement>) {
    loopCount.current += 1;
    if (loopCount.current < totalLoops) {
      void e.currentTarget.play();
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
