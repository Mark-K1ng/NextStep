import Content from '@/features/teacher/availability';
import { TabAsciiReveal } from '@/components/tab-ascii-reveal';

export default function TabScreen() {
  return (
    <TabAsciiReveal tab='availability'>
      <Content />
    </TabAsciiReveal>
  );
}
