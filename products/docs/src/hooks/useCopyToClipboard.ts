import { useState, useCallback } from 'react';

export function useCopyToClipboard(resetMs = 2000): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    });
  }, [resetMs]);

  return [copied, copy];
}
