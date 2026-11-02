import { useState } from 'react';
import { Image, Text, type ImageProps } from 'react-native';
import { AsciiSkeleton } from './skeleton';
import { AsciiReveal, type AsciiRevealProps } from './reveal';

export interface AsciiImageProps extends ImageProps {
  variant?: AsciiRevealProps['variant'];
  duration?: number;
  revealAfterLoading?: boolean;
  loadingLabel?: string;
  errorLabel?: string;
}
export function AsciiImage({
  source,
  variant = 'dither',
  duration,
  revealAfterLoading = false,
  style,
  onLoad,
  onError,
  loadingLabel,
  errorLabel = 'Image unavailable',
  ...props
}: AsciiImageProps) {
  const key = JSON.stringify(source);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <AsciiReveal
      loading={loaded !== key && failed !== key}
      variant={variant}
      duration={duration}
      revealAfterLoading={revealAfterLoading}
      style={style}
      loadingLabel={loadingLabel}
      placeholder={
        <AsciiSkeleton
          variant={variant}
          rows={48}
          width='100%'
          style={style}
          decorative
        />
      }
    >
      {failed === key ? (
        <Text accessibilityRole='alert'>{errorLabel}</Text>
      ) : (
        <Image
          key={key}
          {...props}
          source={source}
          style={style}
          onLoad={(event) => {
            setLoaded(key);
            onLoad?.(event);
          }}
          onError={(event) => {
            setFailed(key);
            onError?.(event);
          }}
        />
      )}
    </AsciiReveal>
  );
}
