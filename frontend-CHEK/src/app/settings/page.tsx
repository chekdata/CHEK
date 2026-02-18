'use client';

import Link from 'next/link';
import { clearToken } from '@/lib/token';

export default function SettingsPage() {
  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">设置</h1>
          <Link href="/me" className="chek-chip gray">
            返回
          </Link>
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>账号与安全</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            MVP 先用手机号验证码登录；更多安全设置后续补齐。
          </div>
        </div>

        <div className="chek-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>通用</div>
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            清缓存 / 关于 / 隐私（后续补齐）。
          </div>
        </div>

        <button
          className="chek-chip gray"
          style={{ border: 'none', cursor: 'pointer', justifyContent: 'center', height: 44 }}
          onClick={() => {
            clearToken();
            window.location.href = '/me';
          }}
        >
          退出登录（清本地 token）
        </button>
      </main>
    </div>
  );
}

