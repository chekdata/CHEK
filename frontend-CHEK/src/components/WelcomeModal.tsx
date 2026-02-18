'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import cat from '@assets/IP/空状态-通用.png';
import { LS_WELCOME_PENDING } from '@/lib/welcome';

export function WelcomeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const pending = window.localStorage.getItem(LS_WELCOME_PENDING) === '1';
      if (pending) setOpen(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function dismiss() {
    try {
      window.localStorage.removeItem(LS_WELCOME_PENDING);
    } catch {}
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="chek-modal-overlay" role="dialog" aria-modal="true" aria-label="欢迎来到 CHEK">
      <div className="chek-modal-card">
        <div className="chek-modal-liquid" />

        <div className="chek-modal-content">
          <Image
            src={cat}
            alt="CHEK 吉祥物"
            width={120}
            height={120}
            priority
            style={{ filter: 'drop-shadow(0 10px 20px rgba(51,136,255,0.2))' }}
          />

          <div className="chek-modal-title">致远道而来的你</div>

          <p className="chek-modal-subtitle">
            如果遇到了不愉快的事，
            <br />
            请允许我们先说一句：
            <br />
            <span className="highlight">对不起，给你添麻烦了。</span>
          </p>

          <button
            type="button"
            className="chek-modal-open"
            onClick={() => {
              dismiss();
              router.push('/letter');
            }}
          >
            打开看看
          </button>
        </div>
      </div>

      <button type="button" className="chek-modal-close" onClick={dismiss} aria-label="关闭">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
