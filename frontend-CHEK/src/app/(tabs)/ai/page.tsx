import Link from 'next/link';

export default function AiPage() {
  return (
    <>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">AI来</h1>
          <Link href="/wiki" className="chek-chip gray">
            先去有知
          </Link>
        </div>
      </header>

      <main className="chek-section">
        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>AI来 还在路上</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            欢迎你来潮汕，路上辛苦了。
            <br />
            这块我们会做成“有依据、有引用”的回答。现在先用「有知」和「相辅」更稳妥。
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Link href="/search" className="chek-chip gray">
              去搜索
            </Link>
            <Link href="/post/new" className="chek-chip">
              去发相辅
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

