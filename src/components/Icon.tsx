import React from 'react';
import { Home, Search, Route, Lightbulb, User, ChevronRight, ChevronLeft, BookOpen, GraduationCap, Briefcase, School, Check, X, Settings, LogOut, Trash2, ArrowRight } from 'lucide-react-native';
import { colors } from '../theme';

interface IconProps {
  name: 'Home' | 'Search' | 'Route' | 'Lightbulb' | 'User' | 'ChevronRight' | 'ChevronLeft' | 'BookOpen' | 'GraduationCap' | 'Briefcase' | 'School' | 'Check' | 'X' | 'Settings' | 'LogOut' | 'Trash2' | 'ArrowRight' | string;
  size?: number;
  color?: string | number;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = colors.dark.textPrimary,
}) => {
  const iconProps = { size, color: color as string };

  switch (name) {
    case 'Home':
      return <Home {...iconProps} />;
    case 'Search':
      return <Search {...iconProps} />;
    case 'Route':
      return <Route {...iconProps} />;
    case 'Lightbulb':
      return <Lightbulb {...iconProps} />;
    case 'User':
      return <User {...iconProps} />;
    case 'ChevronRight':
      return <ChevronRight {...iconProps} />;
    case 'ChevronLeft':
      return <ChevronLeft {...iconProps} />;
    case 'BookOpen':
      return <BookOpen {...iconProps} />;
    case 'GraduationCap':
      return <GraduationCap {...iconProps} />;
    case 'Briefcase':
      return <Briefcase {...iconProps} />;
    case 'School':
      return <School {...iconProps} />;
    case 'Check':
      return <Check {...iconProps} />;
    case 'X':
      return <X {...iconProps} />;
    case 'Settings':
      return <Settings {...iconProps} />;
    case 'LogOut':
      return <LogOut {...iconProps} />;
    case 'Trash2':
      return <Trash2 {...iconProps} />;
    case 'ArrowRight':
      return <ArrowRight {...iconProps} />;
    default:
      return <Home {...iconProps} />;
  }
};
