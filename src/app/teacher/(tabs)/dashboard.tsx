import Content from '@/features/teacher/dashboard';
import { TabAsciiReveal } from '@/components/tab-ascii-reveal';

export default function TabScreen() {
  return (
    <TabAsciiReveal tab='dashboard'>
      <Content />
    </TabAsciiReveal>
  );
}
