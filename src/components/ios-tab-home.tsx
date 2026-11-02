import { useContext } from 'react';
import { IosTabSegmentContext } from './ios-tab-context';
import Home from '@/features/home/home';
import Explore from '@/features/explore/Explore';
import Path from '@/features/path/Path';
import Profile from '@/features/profile/Profile';
import TutoringHome from '@/features/tutoring/tutoring-home';

export default function IosTabHome() {
  const segment = useContext(IosTabSegmentContext);
  if (segment === '(tutoring)') {
    return <TutoringHome />;
  }
  if (segment === '(explore)') {
    return <Explore />;
  }
  if (segment === '(path)') {
    return <Path />;
  }
  if (segment === '(profile)') {
    return <Profile />;
  }
  return <Home />;
}
