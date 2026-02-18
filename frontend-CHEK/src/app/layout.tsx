import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '潮客 CHEK',
  description: '有知（百科）+ 相辅（帖子与评论）。欢迎你来潮汕，路上辛苦了。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="chek-bg-orbs" aria-hidden>
          <div className="chek-orb blue" />
          <div className="chek-orb cyan" />
          <div className="chek-orb pink" />
        </div>
        {children}
      </body>
    </html>
  );
}

