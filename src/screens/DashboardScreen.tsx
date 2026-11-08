import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, EmptyState, Row, Screen, SectionTitle, StatusBadge } from '../components/ui';
import { formatCurrency, formatDate, relativeDueLabel } from '../domain/format';
import { buildDashboard, DashboardBuckets, PolicyWithStatus } from '../services/aggregate';
import { loadPoliciesWithStatus } from '../services/queries';
import { rescheduleDueReminders } from '../services/notifications';
import { callClient, premiumReminderMessage, whatsAppClient } from '../services/contact';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function DueCard({ item }: { item: PolicyWithStatus }) {
  const navigation = useNavigation<Nav>();
  const { policy, summary, daysToDue } = item;
  const phone = policy.clientPhone;
  const reminder = premiumReminderMessage({
    clientName: policy.clientName,
    policyNumber: policy.policyNumber,
    amount: formatCurrency(policy.premiumAmount),
    dueDate: formatDate(summary.nextDueDate),
  });

  return (
    <Card>
      <TouchableOpacity
        onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
        activeOpacity={0.7}
      >
        <Row style={styles.cardHead}>
          <Text style={styles.clientName}>{policy.clientName}</Text>
          <StatusBadge status={summary.status} />
        </Row>
        <Text style={styles.policyNo}>
          {policy.policyNumber}
          {policy.planName ? ` · ${policy.planName}` : ''}
        </Text>
        <Row style={styles.dueRow}>
          <Text style={styles.dueAmount}>{formatCurrency(policy.premiumAmount)}</Text>
          <Text style={styles.dueDate}>
            {daysToDue !== null ? relativeDueLabel(daysToDue) : ''} · {formatDate(summary.nextDueDate)}
          </Text>
        </Row>
        {summary.overdueAmount > 0 ? (
          <Text style={styles.overdue}>Overdue: {formatCurrency(summary.overdueAmount)}</Text>
        ) : null}
      </TouchableOpacity>
      <Row style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <Text style={styles.actionText}>Open policy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('PaymentForm', { policyId: policy.id })}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <Text style={styles.actionText}>Record payment</Text>
        </TouchableOpacity>
      </Row>
      {phone ? (
        <Row style={styles.actions}>
          <TouchableOpacity
            onPress={() => callClient(phone)}
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.callBtn]}
          >
            <Text style={styles.contactText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => whatsAppClient(phone, reminder)}
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.whatsappBtn]}
          >
            <Text style={styles.contactText}>WhatsApp</Text>
          </TouchableOpacity>
        </Row>
      ) : null}
    </Card>
  );
}

export default function DashboardScreen() {
  const [buckets, setBuckets] = useState<DashboardBuckets | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const items = await loadPoliciesWithStatus();
    const metas = items.map((i) => i.policy);
    setBuckets(buildDashboard(metas));
    // Keep local reminders in sync with current dues (best effort, local only).
    rescheduleDueReminders(items).catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const empty =
    buckets &&
    buckets.overdue.length === 0 &&
    buckets.dueThisWeek.length === 0 &&
    buckets.dueThisMonth.length === 0;

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {buckets && buckets.overdue.length > 0 ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total overdue</Text>
            <Text style={styles.summaryValue}>{formatCurrency(buckets.totalOverdueAmount)}</Text>
            <Text style={styles.summaryLabel}>
              {buckets.overdue.length} polic{buckets.overdue.length === 1 ? 'y' : 'ies'} need attention
            </Text>
          </View>
        ) : null}

        {empty ? (
          <EmptyState
            title="No dues coming up"
            subtitle="Premiums due this month and overdue policies will appear here."
          />
        ) : null}

        {buckets && buckets.overdue.length > 0 ? (
          <>
            <SectionTitle>Overdue &amp; lapsed</SectionTitle>
            {buckets.overdue.map((i) => (
              <DueCard key={i.policy.id} item={i} />
            ))}
          </>
        ) : null}

        {buckets && buckets.dueThisWeek.length > 0 ? (
          <>
            <SectionTitle>Due this week</SectionTitle>
            {buckets.dueThisWeek.map((i) => (
              <DueCard key={i.policy.id} item={i} />
            ))}
          </>
        ) : null}

        {buckets && buckets.dueThisMonth.length > 0 ? (
          <>
            <SectionTitle>Due this month</SectionTitle>
            {buckets.dueThisMonth.map((i) => (
              <DueCard key={i.policy.id} item={i} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.xl,
  },
  summaryLabel: { color: colors.primaryLight, fontSize: 13, fontWeight: '600' },
  summaryValue: { color: colors.white, fontSize: 32, fontWeight: '800', marginVertical: spacing.xs },
  cardHead: { justifyContent: 'space-between' },
  clientName: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  policyNo: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  dueRow: { justifyContent: 'space-between', marginTop: spacing.sm },
  dueAmount: { fontSize: 18, fontWeight: '800', color: colors.text },
  dueDate: { fontSize: 13, color: colors.textMuted },
  overdue: { marginTop: spacing.xs, color: colors.danger, fontWeight: '700', fontSize: 13 },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  callBtn: { backgroundColor: colors.primary },
  whatsappBtn: { backgroundColor: '#25D366' },
  contactText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
