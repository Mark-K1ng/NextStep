import { prepareIosTabReveal, registerIosTabReveal, startIosTabReveal } from './ios-tab-context';

it('starts every rapid selection once and prepares outgoing tabs immediately', () => {
  const a = { start: jest.fn(), prepare: jest.fn(), settle: jest.fn() };
  const b = { start: jest.fn(), prepare: jest.fn(), settle: jest.fn() };
  const removeA = registerIosTabReveal('a', a.start, a.prepare, a.settle);
  const removeB = registerIosTabReveal('b', b.start, b.prepare, b.settle);
  try {
    for (let i = 0; i < 8; i++) {
      const tab = i % 2 === 0 ? 'a' : 'b';
      startIosTabReveal(tab);
      startIosTabReveal(tab);
    }
    expect(a.start).toHaveBeenCalledTimes(4);
    expect(b.start).toHaveBeenCalledTimes(4);
    expect(a.prepare).toHaveBeenCalledTimes(4);
    expect(b.prepare).toHaveBeenCalledTimes(3);
    expect(a.settle).not.toHaveBeenCalled();
    expect(b.settle).not.toHaveBeenCalled();
  } finally {
    removeA(); removeB();
  }
});

it('allows the same prepared tab to reappear and preserves replacement registrations', () => {
  const stale = registerIosTabReveal('a', jest.fn());
  const start = jest.fn();
  const remove = registerIosTabReveal('a', start, jest.fn(), jest.fn());
  try {
    stale();
    startIosTabReveal('a');
    prepareIosTabReveal('a');
    startIosTabReveal('a');
    expect(start).toHaveBeenCalledTimes(2);
  } finally {
    remove();
  }
});
