import Image from 'next/image';
import cat from '@assets/IP/空状态-通用.png';
import { SkeletonBlock, SkeletonLines } from '@/components/Skeleton';

type PageLoadingProps = {
  title?: string;
  hint?: string;
  rows?: number;
};

export function PageLoading({
  title = '正在加载',
  hint = '内容马上就到，劳等一下。',
  rows = 3,
}: PageLoadingProps) {
  return (
    <div className="chek-shell" style={{ paddingBottom: 24 }}>
      <header className="chek-header">
        <div className="chek-title-row">
          <h1 className="chek-title">{title}</h1>
          <SkeletonBlock width={70} height={30} radius={999} />
        </div>
      </header>

      <main className="chek-section" style={{ display: 'grid', gap: 12 }}>
        <div className="chek-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src={cat} alt="" width={42} height={42} style={{ borderRadius: 12 }} />
          <div className="chek-muted" style={{ lineHeight: 1.7 }}>
            {hint}
          </div>
        </div>

        {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
          <div key={index} className="chek-card" style={{ padding: 16, display: 'grid', gap: 10 }}>
            <SkeletonBlock width="55%" height={16} radius={10} />
            <SkeletonLines lines={2} widths={['88%', '72%']} />
          </div>
        ))}
      </main>
    </div>
  );
}
