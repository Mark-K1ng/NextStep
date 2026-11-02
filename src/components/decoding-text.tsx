import {
  createContext,
  isValidElement,
  useContext,
  type ReactNode,
} from 'react';
import {
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { AsciiText } from '@nextstep/ascii-reveal-native';
import { useAsciiSkinAnimation } from './ascii-skin';

const NestedText = createContext(false);
export function decodingTextValue(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(decodingTextValue).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return decodingTextValue(node.props.children);
  }
  return '';
}
// A Text's flex/margins belong to the decode wrapper, not to both native layers.
const layoutKeys = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'zIndex',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginVertical',
  'marginHorizontal',
  'marginStart',
  'marginEnd',
]);
export function splitDecodingStyle(style: TextStyle = {}) {
  const text: Record<string, unknown> = {},
    layout: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    (layoutKeys.has(key) ? layout : text)[key] = value;
  }
  return { text: text as TextStyle, layout: layout as ViewStyle };
}

/** Native Text outside a skin scope; one coordinated decoder per text block inside it. */
export function DecodingText({ children, style, ...props }: TextProps) {
  const animation = useAsciiSkinAnimation();
  const nested = useContext(NestedText);
  if (!animation || nested) {
    return (
      <Text {...props} style={style}>
        {children}
      </Text>
    );
  }
  const value = decodingTextValue(children);
  if (!value) {
    return (
      <Text {...props} style={style}>
        {children}
      </Text>
    );
  }
  const styles = splitDecodingStyle(StyleSheet.flatten(style));
  return (
    <NestedText.Provider value>
      <AsciiText
        {...props}
        text={value}
        duration={600}
        progress={animation.progress}
        initialProgress={animation.initialProgress}
        animate={
          animation.enabled &&
          animation.active &&
          !animation.reduced &&
          (!animation.finished || animation.preparedNativeTab === true)
        }
        containerStyle={[styles.layout, ui.overlayText]}
        style={styles.text}
      >
        {children}
      </AsciiText>
    </NestedText.Provider>
  );
}
const ui = StyleSheet.create({ overlayText: { zIndex: 1 } });
