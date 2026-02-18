import Link from 'next/link';

export default function TimelinePage() {
  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">劳热</h1>
          <Link href="/wiki" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section">
        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>建设中</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            劳热会把有知/相辅里“带时间”的信息串成时间线，方便你快速看脉络。
            <br />
            现在先把有知和相辅做扎实，给你添麻烦了，先抱歉。
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Link href="/wiki" className="chek-chip gray">
              去有知
            </Link>
            <Link href="/feed" className="chek-chip gray">
              去相辅
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

