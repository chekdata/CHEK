'use client';

import { useState } from 'react';
import { shareLink } from '@/lib/share';

export function ShareIconButton({
  url,
  title,
  className,
  style,
  ariaLabel,
}: {
  url: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const [hint, setHint] = useState('');

  async function onShare() {
    const method = await shareLink({ url, title });
    if (method === 'copied') {
      setHint('已复制');
      window.setTimeout(() => setHint(''), 1200);
    }
  }

  return (
    <button type="button" className={className} style={style} aria-label={ariaLabel || '分享'} onClick={onShare}>
      {hint ? (
        <span style={{ fontSize: 12, fontWeight: 800 }}>{hint}</span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}

