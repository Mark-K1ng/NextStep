import type { PropsWithChildren } from 'react';
// Stable host components for application unit tests. Package tests import the
// real sources directly; device checks exercise the native animation runtime.
export const AsciiProvider = ({ children }: PropsWithChildren) => children;
export const AsciiSkeleton = 'ascii-skeleton';
export const AsciiReveal = ({ children }: PropsWithChildren) => children;
export const AsciiText = 'ascii-text';
export const AsciiImage = 'ascii-image';

export const AsciiActivity = ({ children }: PropsWithChildren<{ active: boolean }>) => children;
