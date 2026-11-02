import Content from '@/features/teacher/lessons';
import { TabAsciiReveal } from '@/components/tab-ascii-reveal';

export default function TabScreen() {
  return (
    <TabAsciiReveal tab='lessons'>
      <Content />
    </TabAsciiReveal>
  );
}
