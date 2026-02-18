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
        <path d="M8 6h13" />
        <path d="M3 6h.01" />
        <path d="M8 12h13" />
        <path d="M3 12h.01" />
        <path d="M8 18h13" />
        <path d="M3 18h.01" />
      </svg>
    );
  }
  if (props.name === 'wiki') {
    return (
      <svg {...common} aria-hidden>
        <path d="M4 19a2 2 0 0 0 2 2h12" />
        <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z" />
      </svg>
    );
  }
  if (props.name === 'ai') {
    return (
      <svg {...common} aria-hidden>
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M4.2 4.2l2.1 2.1" />
        <path d="M17.7 17.7l2.1 2.1" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
        <path d="M4.2 19.8l2.1-2.1" />
        <path d="M17.7 6.3l2.1-2.1" />
        <path d="M12 7a5 5 0 1 0 5 5" />
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

        <Link href="/post/new" className="chek-plus" aria-label="+ 来相辅">
          + 来相辅
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

