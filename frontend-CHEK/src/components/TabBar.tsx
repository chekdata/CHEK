'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

function Icon(props: { name: 'feed' | 'wiki' | 'ai' | 'me'; active: boolean }) {
  const stroke = props.active ? 'var(--chek-primary)' : 'rgba(0,0,0,0.55)';
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (props.name === 'feed') {
    return (
      <svg {...common} aria-hidden>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    );
  }
  if (props.name === 'wiki') {
    return (
      <svg {...common} aria-hidden>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  if (props.name === 'ai') {
    return (
      <svg {...common} aria-hidden>
        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
        <path d="M12 2a10 10 0 0 1 10 10" />
        <path d="M12 12L2.5 7.5" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const active = (p: string) => pathname === p || pathname.startsWith(`${p}/`);

  return (
    <nav className="chek-tabbar" aria-label="主导航">
      <div className="chek-tabbar-row">
        <Link href="/feed" className={clsx('chek-tab', active('/feed') && 'active')}>
          <Icon name="feed" active={active('/feed')} />
          <div>相辅</div>
        </Link>

        <Link href="/wiki" className={clsx('chek-tab', active('/wiki') && 'active')}>
          <Icon name="wiki" active={active('/wiki')} />
          <div>有知</div>
        </Link>

        <Link href="/post/new" className="chek-fab-wrapper" aria-label="+ 来相辅">
          <div className="chek-fab-btn" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        </Link>

        <Link href="/ai" className={clsx('chek-tab', active('/ai') && 'active')}>
          <Icon name="ai" active={active('/ai')} />
          <div>AI来</div>
        </Link>

        <Link href="/me" className={clsx('chek-tab', active('/me') && 'active')}>
          <Icon name="me" active={active('/me')} />
          <div>胶己</div>
        </Link>
      </div>
    </nav>
  );
}
