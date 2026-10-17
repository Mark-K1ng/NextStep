/**
 * Profile danger zone component
 * Displays destructive actions like delete account
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../theme';
import { Button } from '../Button';

interface ProfileDangerZoneProps {
  onDeleteAccount: () => void;
  loading?: boolean;
}

export function ProfileDangerZone({ onDeleteAccount, loading }: ProfileDangerZoneProps) {
  return (
    <View style={styles.dangerSection}>
      <Button
        title={loading ? 'Se șterge...' : 'Șterge contul'}
        onPress={onDeleteAccount}
        disabled={loading}
        variant="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dangerSection: {
    marginBottom: spacing.xl,
  },
});
