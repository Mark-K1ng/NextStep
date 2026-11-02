import { FlatList, type FlatListProps } from 'react-native';

export type SelectionOption = {
  value: string;
  label: string;
  description?: string;
};
export type SelectionListProps = FlatListProps<SelectionOption> & {
  selectedValue: string;
  onChoose(value: string): void;
};
export function SelectionList({
  selectedValue: _selectedValue,
  onChoose: _onChoose,
  ...props
}: SelectionListProps) {
  return <FlatList {...props} />;
}
