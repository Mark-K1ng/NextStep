import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { useDebouncedValue } from './use-debounced-value';
it('cancels intermediate search updates while the user is still typing', async () => {
  jest.useFakeTimers();
  const root = createRoot();
  let settled = '';
  function Probe({ value }: { value: string }) {
    settled = useDebouncedValue(value);
    return null;
  }
  try {
    await act(async () => root.render(createElement(Probe, { value: '' })));
    await act(async () => root.render(createElement(Probe, { value: 'G' })));
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    await act(async () =>
      root.render(createElement(Probe, { value: 'Gojdu' }))
    );
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    expect(settled).toBe('');
    await act(async () => {
      jest.advanceTimersByTime(50);
    });
    expect(settled).toBe('Gojdu');
  } finally {
    await act(async () => root.unmount());
    jest.useRealTimers();
  }
});
