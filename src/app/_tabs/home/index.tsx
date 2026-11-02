import Content from '@/features/home/home';
import { TabAsciiReveal } from '@/components/tab-ascii-reveal';

export default function TabScreen() {
  return (
    <TabAsciiReveal tab='home'>
      <Content />
    </TabAsciiReveal>
  );
}
