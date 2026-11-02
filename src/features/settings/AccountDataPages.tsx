import {
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Button, Input } from '@/components';
import { BackHeader, Copy, Panel, Screen } from '@/components/design';
import { useSession } from '@/providers/auth';
import { useSaved } from '@/providers/saved';
import { useToast } from '@/providers/toast';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { exportMyData, deleteMyAccount } from '@/services/account-data';
import { saveDataExport } from '@/lib/export-data';
import { radius, spacing } from '@/theme/tokens';

export function DataExportPage() {
  const { session } = useSession();
  const { items, ready, error: savedError, retry } = useSaved();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const running = useRef(false);
  const theme = useTheme();
  const exportData = async () => {
    if (!session || !ready || savedError || running.current) {
      return;
    }
    running.current = true;
    setBusy(true);
    setError(false);
    setDone(false);
    try {
      const data = await exportMyData(
        session.user.id,
        session.user.email,
        items
      );
      await saveDataExport(data);
      setDone(true);
    } catch {
      setError(true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen tab='profile' nativeTitle={ro.profile.exportData}>
      {Platform.OS !== 'ios' && <BackHeader title={ro.profile.exportData} />}
      <Copy>{ro.accountData.exportIntro}</Copy>
      <Panel>
        <Copy kind='heading'>{ro.accountData.exportIncludes}</Copy>
        <Copy>{ro.accountData.exportContents}</Copy>
        <Copy>{ro.accountData.exportPrivate}</Copy>
      </Panel>
      {(error || savedError) && (
        <Copy
          accessibilityRole='alert'
          accessibilityLiveRegion='polite'
          style={{ color: theme.dangerText }}
        >
          {ro.feedback.exportFailed}
        </Copy>
      )}
      {savedError ? (
        <Button onPress={retry}>{ro.common.retry}</Button>
      ) : (
        <Button
          loading={busy}
          disabled={!ready || !session}
          onPress={exportData}
        >
          {ro.accountData.exportAction}
        </Button>
      )}
      {done && (
        <Copy accessibilityLiveRegion='polite'>
          {ro.accountData.exportDone}
        </Copy>
      )}
    </Screen>
  );
}

export function DeleteAccountPage() {
  const { session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const theme = useTheme();
  const [confirmation, setConfirmation] = useState('');
  const [warningOpen, setWarningOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const running = useRef(false);
  const confirmed = confirmation.trim() === ro.accountData.deleteWord;
  const deleteAccount = async () => {
    if (!session || !confirmed || !warningOpen || running.current) {
      return;
    }
    running.current = true;
    setBusy(true);
    setError(false);
    try {
      await deleteMyAccount(
        session.user.id,
        session.user.user_metadata?.nextstep_guest_intake
      );
      toast(ro.profile.deleteSuccess);
      router.replace('/(auth)/login');
    } catch {
      setWarningOpen(false);
      setError(true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen tab='profile' nativeTitle={ro.profile.deleteAccount}>
      {Platform.OS !== 'ios' && <BackHeader title={ro.profile.deleteAccount} />}
      <Copy>{ro.profile.confirmDelete}</Copy>
      <Panel>
        <Copy kind='heading'>{ro.accountData.deleteIncludes}</Copy>
        <Copy>{ro.accountData.deleteContents}</Copy>
        <Copy>{ro.accountData.deleteCopies}</Copy>
      </Panel>
      <Button
        variant='outline'
        disabled={busy}
        onPress={() => router.push('/data-export')}
      >
        {ro.profile.exportData}
      </Button>
      <Input
        label={ro.accountData.deleteLabel}
        accessibilityLabel={ro.accountData.deleteLabel}
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize='characters'
        autoCorrect={false}
        editable={!busy}
      />
      {error && (
        <Copy
          accessibilityRole='alert'
          accessibilityLiveRegion='polite'
          style={{ color: theme.dangerText }}
        >
          {ro.feedback.deleteFailed}
        </Copy>
      )}
      <Button
        loading={busy}
        disabled={!confirmed || !session}
        variant='outline'
        textStyle={{ color: theme.dangerText }}
        onPress={() => {
          if (!confirmed || !session || running.current) {
            return;
          }
          Keyboard.dismiss();
          setWarningOpen(true);
        }}
      >
        {ro.accountData.deleteAction}
      </Button>
      <Button variant='outline' disabled={busy} onPress={() => router.back()}>
        {ro.common.cancel}
      </Button>
      {warningOpen && (
        <Modal
          transparent
          animationType='none'
          onRequestClose={() => {
            if (!running.current) {
              setWarningOpen(false);
            }
          }}
        >
          <ScrollView
            style={styles.warningBackdrop}
            contentContainerStyle={styles.warningLayout}
            keyboardShouldPersistTaps='handled'
          >
            <View
              accessibilityViewIsModal
              onAccessibilityEscape={() => {
                if (!running.current) {
                  setWarningOpen(false);
                }
              }}
              style={[
                styles.warningCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                accessible={false}
                style={[
                  styles.warningIcon,
                  { backgroundColor: theme.dangerSurface },
                ]}
              >
                <Trash2 size={28} color={theme.dangerText} />
              </View>
              <Copy kind='heading' accessibilityRole='header'>
                {ro.profile.deleteAccount}
              </Copy>
              <Copy>{ro.profile.confirmDelete}</Copy>
              <Button
                variant='outline'
                disabled={busy}
                onPress={() => setWarningOpen(false)}
              >
                {ro.common.cancel}
              </Button>
              <Button
                variant='outline'
                loading={busy}
                disabled={!confirmed || !session || busy}
                style={{
                  backgroundColor: theme.dangerSurface,
                  borderColor: theme.dangerText,
                }}
                textStyle={{ color: theme.dangerText }}
                onPress={deleteAccount}
              >
                {ro.accountData.deleteAction}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  warningBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  warningLayout: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  warningCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderWidth: 1,
    borderCurve: 'continuous',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  warningIcon: {
    width: 48,
    height: 48,
    borderCurve: 'continuous',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
