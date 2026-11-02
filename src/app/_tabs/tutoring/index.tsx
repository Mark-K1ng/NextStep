import Content from '@/features/tutoring/tutoring-home';
import { TabAsciiReveal } from '@/components/tab-ascii-reveal';

export default function TabScreen() {
  return (
    <TabAsciiReveal tab='tutoring'>
      <Content />
    </TabAsciiReveal>
  );
}
