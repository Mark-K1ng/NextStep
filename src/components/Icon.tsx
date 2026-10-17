import React from 'react';
import { View } from 'react-native';
import { Home, Search, Route, Lightbulb, User } from 'lucide-react-native';
import { colors } from '../theme';

interface IconProps {
  name: 'Home' | 'Search' | 'Route' | 'Lightbulb' | 'User';
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
    default:
      return null;
  }
};
