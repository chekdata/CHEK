import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">找不到啦</h1>
          <Link href="/feed" className="chek-chip gray">
            回相辅
          </Link>
        </div>
      </header>

      <main className="chek-section">
        <div className="chek-card" style={{ padding: 16 }}>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            给你添麻烦了，真诚抱歉。
            <br />
            你可以回到相辅看看最新帖子，或者去有知搜一下。
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Link href="/feed" className="chek-chip gray">
              去相辅
            </Link>
            <Link href="/wiki" className="chek-chip gray">
              去有知
            </Link>
            <Link href="/search" className="chek-chip">
              去搜索
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

