import { Suspense } from 'react';
import WeChatCallbackClient from './WeChatCallbackClient';

export default function WeChatCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="chek-shell" style={{ paddingBottom: 24 }}>
          <main className="chek-section">
            <div className="chek-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>加载中…</div>
              <div className="chek-muted">给你添麻烦了，稍等一下。</div>
            </div>
          </main>
        </div>
      }
    >
      <WeChatCallbackClient />
    </Suspense>
  );
}

