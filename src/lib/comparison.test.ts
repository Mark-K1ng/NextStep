import { selectComparison } from './comparison';
import type { ExploreItem } from '@/types/models';
const first: ExploreItem = {
  id: 'first',
  type: 'school_profiles',
  name: 'Mate-Info',
};
const second: ExploreItem = {
  id: 'second',
  type: 'school_profiles',
  name: 'Filologie',
};
it('retains the initiating option when choosing and replacing a compatible alternative', () => {
  expect(selectComparison([first], second)).toEqual([first, second]);
  const replacement = { ...second, id: 'third' };
  expect(selectComparison([first, second], replacement)).toEqual([
    first,
    replacement,
  ]);
});
it('rejects the same option, incompatible entity types and a missing starting option', () => {
  expect(selectComparison([first], first)).toEqual([first]);
  expect(selectComparison([first], { ...second, type: 'careers' })).toEqual([
    first,
  ]);
  expect(selectComparison([], second)).toEqual([]);
});
