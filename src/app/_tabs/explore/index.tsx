import Content from '@/features/explore/Explore';
import { TabAsciiReveal } from '@/components/tab-ascii-reveal';

export default function TabScreen() {
  return (
    <TabAsciiReveal tab='explore'>
      <Content />
    </TabAsciiReveal>
  );
}
