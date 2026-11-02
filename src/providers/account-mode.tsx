import { createContext, useContext } from 'react';
import type { AccountAccess } from '@/services/account-access';

interface AccountMode {
  access: AccountAccess | undefined;
  isTeacher: boolean;
  isApprovedTeacher: boolean;
  isPreview: boolean;
  isPending: boolean;
  error: boolean;
  previewCounty: string;
  setPreviewCounty(county: string): void;
  enterPreview(): void;
  exitPreview(): void;
  refresh(): Promise<unknown>;
}
export const AccountModeContext = createContext<AccountMode>({
  access: undefined,
  isTeacher: false,
  isApprovedTeacher: false,
  isPreview: false,
  isPending: false,
  error: false,
  previewCounty: '',
  setPreviewCounty() {},
  enterPreview() {},
  exitPreview() {},
  async refresh() {},
});
export const useAccountMode = () => useContext(AccountModeContext);
