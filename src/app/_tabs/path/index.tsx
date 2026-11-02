import Content from '@/features/path/Path';
import { TabAsciiReveal } from '@/components/tab-ascii-reveal';

export default function TabScreen() {
  return (
    <TabAsciiReveal tab='path'>
      <Content />
    </TabAsciiReveal>
  );
}
