import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { formatCurrency, formatDate } from '../domain/format';
import type { PolicyWithStatus } from '../services/aggregate';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { ListRow, ProgressBar, StatusBadge } from './ui';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Outlined policy row with status badge and a thin premiums-paid bar. */
export function PolicyRow({ item, showClient = true }: { item: PolicyWithStatus; showClient?: boolean }) {
  const navigation = useNavigation<Nav>();
  const { policy, summary } = item;
  const subtitle = [showClient ? policy.clientName : null, policy.planName].filter(Boolean).join(' · ');
  return (
    <ListRow
      title={policy.policyNumber}
      subtitle={subtitle || null}
      meta={`SA ${formatCurrency(policy.sumAssured)} · ${formatCurrency(policy.premiumAmount)} ${policy.premiumMode}`}
      trailing={<StatusBadge status={summary.status} />}
      onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
    >
      <Text style={styles.next}>
        {summary.nextDueDate ? `Next due ${formatDate(summary.nextDueDate)}` : 'No premium due'}
        {summary.overdueAmount > 0 ? `  ·  Overdue ${formatCurrency(summary.overdueAmount)}` : ''}
      </Text>
      {summary.totalPremiums > 0 ? (
        <>
          <ProgressBar value={summary.paidCount / summary.totalPremiums} style={styles.bar} />
          <Text style={styles.barLabel}>
            {summary.paidCount} of {summary.totalPremiums} premiums paid
          </Text>
        </>
      ) : null}
    </ListRow>
  );
}

const styles = StyleSheet.create({
  next: { fontSize: 13, color: colors.text, fontWeight: '600', marginTop: spacing.sm },
  bar: { marginTop: spacing.sm },
  barLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
