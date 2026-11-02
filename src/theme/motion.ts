import { cubicBezier, Easing } from 'react-native-reanimated';

export const motion = {
  press: 120,
  reveal: 240,
  state: 180,
  stagger: 40,
  travel: 8,
  pressedScale: 0.97,
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  transitionEase: cubicBezier(0.23, 1, 0.32, 1),
} as const;
