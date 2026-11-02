import Content from '@/features/profile/Profile';
import { TabAsciiReveal } from '@/components/tab-ascii-reveal';

export default function TabScreen() {
  return (
    <TabAsciiReveal tab='profile'>
      <Content />
    </TabAsciiReveal>
  );
}
