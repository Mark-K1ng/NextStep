import { parsePrice, money } from './tutoring';
it.each([
  ['100', 10000],
  ['90,50', 9050],
  ['110.01', 11001],
  ['5000', 500000],
])('parses money without floating point rounding: %s', (input, expected) => {
  expect(parsePrice(input)).toBe(expected);
});
it.each([
  '1',
  '0',
  '-10',
  '100.001',
  '1e3',
  'Infinity',
  '5000.01',
  '',
  '100abc',
])('rejects invalid or out-of-range price %s', (input) => {
  expect(parsePrice(input)).toBeNull();
});
it('formats the price snapshot in Romanian lei', () => {
  expect(money(10000)).toContain('100');
  expect(money(10000)).toContain('RON');
});
