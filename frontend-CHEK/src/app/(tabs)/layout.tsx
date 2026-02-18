import { TabBar } from '@/components/TabBar';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="chek-shell">
      {children}
      <TabBar />
    </div>
  );
}

