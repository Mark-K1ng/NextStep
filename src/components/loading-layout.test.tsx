import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { DataState } from './data-state';
import type { LoadingLayout } from './loading-layout';
jest.mock('react-native', () => ({ View: 'view', StyleSheet: { create: (s: unknown) => s } }));
jest.mock('./design', () => ({ Panel: 'panel', Copy: 'copy' }));
jest.mock('./Button', () => ({ Button: 'button' }));
let root: Root;
beforeEach(() => { root = createRoot(); });
afterEach(async () => act(async () => root.unmount()));
it.each(['catalogue', 'profile', 'home', 'path', 'form', 'detail', 'settings', 'tutor', 'lesson', 'dashboard', 'comparison', 'recommendations'] as LoadingLayout[])('keeps %s loading content structural, noninteractive and accessible once', async loadingLayout => {
  await act(async () => root.render(createElement(DataState, { loading: true, loadingLayout })));
  expect(root.container.queryAll(n => n.props.accessibilityRole === 'progressbar')).toHaveLength(1);
  const shapes = root.container.queryAll(n => n.type === 'ascii-skeleton');
  expect(shapes.length).toBeGreaterThan(1);
  expect(shapes.every(n => n.props.decorative)).toBe(true);
  expect(root.container.queryAll(n => n.type === 'button')).toHaveLength(0);
  // No unrelated cover-image rectangle in a text/form/list loading state.
  expect(shapes.some(n => n.props.height === 120)).toBe(false);
});
it('allows an exact caller-owned skeleton instead of any stock layout, then removes it when ready', async () => {
  await act(async () => root.render(createElement(DataState, { loading: true, loadingContent: createElement('exact-chart-layout') })));
  expect(root.container.queryAll(n => n.type === 'exact-chart-layout')).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'ascii-skeleton')).toHaveLength(0);
  await act(async () => root.render(createElement(DataState, { error: true, retry: jest.fn() })));
  expect(root.container.queryAll(n => n.type === 'exact-chart-layout')).toHaveLength(0);
  expect(root.container.queryAll(n => n.props.accessibilityRole === 'alert')).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'button')).toHaveLength(1);
});
