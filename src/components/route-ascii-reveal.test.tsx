import { act, createElement, useState } from 'react';
import { createRoot } from 'test-renderer';
import { renderAsciiScreen } from './route-ascii-reveal';

let mockFocused = true;
let mockParent: { preparedNativeTab?: boolean; completion: { current: boolean } } | null = null;
beforeEach(() => { mockFocused = true; mockParent = null; });
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' },
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('./ascii-skin', () => ({ AsciiSkin: 'skin', useAsciiSkinAnimation: () => mockParent }));

it('replays screen entries without replacing form or scroll state', async () => {
  const root = createRoot();
  function Content() {
    const [value, setValue] = useState('Draft');
    return createElement('form', { value, setValue });
  }
  const tree = () => renderAsciiScreen({ children: createElement(Content) });
  try {
    await act(async () => root.render(tree()));
    const form = () => root.container.queryAll((n) => n.type === 'form')[0];
    await act(async () => form().props.setValue('Unsaved input'));
    for (const focused of [false, true, false, true]) {
      mockFocused = focused;
      await act(async () => root.render(tree()));
      expect(
        root.container.queryAll((n) => n.type === 'skin')[0].props
      ).toMatchObject({ enabled: focused, internal: true, inherit: false, duration: 220, replayOnFocus: true, prepareOnBlur: true });
      expect(form().props.value).toBe('Unsaved input');
    }
  } finally {
    await act(async () => root.unmount());
  }
});


it('retains the native parent only for the tab root, leaving new detail reveals independent', async () => {
  const root = createRoot();
  try {
    for (const name of ['index', 'course/[id]', 'palette']) {
      await act(async () => root.render(renderAsciiScreen({ route: { name }, children: createElement('page') })));
      expect(root.container.queryAll(n => n.type === 'skin')[0].props.retainPreparedParent).toBe(name === 'index');
    }
  } finally { await act(async () => root.unmount()); }
});


it('leaves navigator containers to their child screen reveal', () => {
  for (const name of ['_tabs', '(auth)', 'teacher', 'tutoring', '(tabs)']) {
    const child = createElement('navigator');
    expect(renderAsciiScreen({ route: { name }, children: child }).props.children).toBe(child);
  }
});


it('replays a return from details but borrows a freshly started native tab entry', async () => {
  const root = createRoot();
  mockParent = { preparedNativeTab: true, completion: { current: false } };
  const tree = () => renderAsciiScreen({ route: { name: 'index' }, children: createElement('page') });
  const props = () => root.container.queryAll(n => n.type === 'skin')[0].props;
  try {
    await act(async () => root.render(tree()));
    expect(props().inherit).toBe(true);
    mockParent.completion.current = true;
    await act(async () => root.render(tree()));
    expect(props().inherit).toBe(true);
    mockFocused = false;
    await act(async () => root.render(tree()));
    mockFocused = true;
    await act(async () => root.render(tree()));
    expect(props().inherit).toBe(false);
    mockParent.completion.current = false;
    await act(async () => root.render(tree()));
    expect(props().inherit).toBe(true);
    mockFocused = false;
    await act(async () => root.render(tree()));
    mockParent.completion.current = false;
    mockFocused = true;
    await act(async () => root.render(tree()));
    expect(props().inherit).toBe(true);
  } finally { await act(async () => root.unmount()); }
});
