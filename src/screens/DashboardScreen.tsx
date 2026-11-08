import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  SectionHeader,
  EmptyState,
  HeaderBlock,
  IconButton,
  ListRow,
  ProgressRing,
  Row,
  Screen,
  SectionTitle,
  StatTile,
  StatusBadge,
} from '../components/ui';
import { formatCurrency, formatDate, relativeDueLabel } from '../domain/format';
import type { MonthInstalments } from '../domain/premium';
import {
  buildDashboard,
  DashboardBuckets,
  monthlyCollection,
  PolicyWithStatus,
} from '../services/aggregate';
import { loadPoliciesWithStatus } from '../services/queries';
import { rescheduleDueReminders } from '../services/notifications';
import { callClient, premiumReminderMessage, whatsAppClient } from '../services/contact';
import { MeetingRow } from '../components/MeetingRow';
import { listMeetings, MeetingWithMeta } from '../db/meetings';
import { upcomingWithinDays } from '../domain/meetings';
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
    <ListRow
      title={policy.clientName}
      subtitle={`${policy.policyNumber}${policy.planName ? ` · ${policy.planName}` : ''}`}
      onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
      trailing={<StatusBadge status={summary.status} />}
    >
      <Row style={styles.dueRow}>
        <Text style={styles.dueAmount}>{formatCurrency(policy.premiumAmount)}</Text>
        <Text style={styles.dueDate}>
          {daysToDue !== null ? relativeDueLabel(daysToDue) : ''} · {formatDate(summary.nextDueDate)}
        </Text>
      </Row>
      {summary.overdueAmount > 0 ? (
        <Text style={styles.overdue}>Overdue {formatCurrency(summary.overdueAmount)}</Text>
      ) : null}
      <Row style={styles.actions}>
        <Button
          title="Record payment"
          compact
          onPress={() => navigation.navigate('PaymentForm', { policyId: policy.id })}
          style={styles.recordBtn}
        />
        {phone ? (
          <>
            <IconButton
              icon="phone"
              filled
              accessibilityLabel={`Call ${policy.clientName}`}
              onPress={() => callClient(phone)}
            />
            <IconButton
              icon="chat"
              accessibilityLabel={`WhatsApp ${policy.clientName}`}
              onPress={() => whatsAppClient(phone, reminder)}
            />
          </>
        ) : null}
      </Row>
    </ListRow>
  );
}

function MonthCard({ month }: { month: MonthInstalments }) {
  const share = month.due > 0 ? month.paid / month.due : 0;
  return (
    <Card style={styles.monthCard}>
      <View style={styles.monthText}>
        <Text style={styles.monthTitle}>This month&apos;s premiums</Text>
        {month.due > 0 ? (
          <>
            <Text style={styles.monthSub}>
              {month.paid} of {month.due} collected
            </Text>
            <Text style={styles.monthAmount}>{formatCurrency(month.paidAmount)}</Text>
            <Text style={styles.monthSub}>of {formatCurrency(month.dueAmount)} due</Text>
          </>
        ) : (
          <Text style={styles.monthSub}>No premiums fall due this month.</Text>
        )}
      </View>
      {month.due > 0 ? <ProgressRing value={share} caption="collected" /> : null}
    </Card>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [buckets, setBuckets] = useState<DashboardBuckets | null>(null);
  const [month, setMonth] = useState<MonthInstalments | null>(null);
  const [policyCount, setPolicyCount] = useState(0);
  const [meetingCount, setMeetingCount] = useState(0);
  const [soonMeetings, setSoonMeetings] = useState<MeetingWithMeta[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const items = await loadPoliciesWithStatus();
    const metas = items.map((i) => i.policy);
    setPolicyCount(items.length);
    setBuckets(buildDashboard(metas));
    setMonth(monthlyCollection(metas));
    const meetings = await listMeetings();
    setMeetingCount(meetings.length);
    // Today and the next three days.
    setSoonMeetings(upcomingWithinDays(meetings, 3));
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

  if (!buckets || !month) return <Screen />;

  if (policyCount === 0 && meetingCount === 0) {
    return (
      <Screen style={styles.welcome}>
        <ScrollView contentContainerStyle={styles.welcomeScroll}>
          <EmptyState
            illustration="welcome"
            title="Welcome to LIC Policy Manager"
            subtitle="Keep every policyholder, premium and due date on your phone. Add a client, then register their policies to start getting due reminders."
          >
            <Button title="Add your first client" onPress={() => navigation.navigate('ClientForm')} />
            <Button
              title="Add a policy"
              variant="secondary"
              onPress={() => navigation.navigate('PolicyForm')}
            />
          </EmptyState>
        </ScrollView>
      </Screen>
    );
  }

  const noDues =
    buckets.overdue.length === 0 && buckets.dueThisWeek.length === 0 && buckets.dueThisMonth.length === 0;

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        <HeaderBlock decor="blob">
          <Text style={styles.headerKicker}>Collections</Text>
          <MonthCard month={month} />
          <Row style={styles.stats}>
            <StatTile
              small
              style={styles.overdueTile}
              value={formatCurrency(buckets.totalOverdueAmount)}
              label={`overdue · ${buckets.overdue.length} polic${buckets.overdue.length === 1 ? 'y' : 'ies'}`}
            />
            <StatTile value={String(buckets.dueThisWeek.length)} label="due this week" />
            <StatTile value={String(buckets.dueThisMonth.length)} label="due later this month" />
          </Row>
        </HeaderBlock>

        <SectionHeader
          title="Upcoming meetings"
          actionLabel="Meeting"
          onAction={() => navigation.navigate('MeetingForm')}
        />
        {soonMeetings.length === 0 ? (
          <Text style={styles.muted}>No meetings in the next few days.</Text>
        ) : (
          soonMeetings.map((m) => <MeetingRow key={m.id} meeting={m} />)
        )}
        <Button
          title="All meetings"
          variant="ghost"
          chevron
          onPress={() => navigation.navigate('Meetings')}
          style={styles.allMeetings}
        />

        {noDues ? (
          <EmptyState
            illustration="allClear"
            title="No dues coming up"
            subtitle="Premiums due this month and overdue policies will appear here."
          />
        ) : null}

        {buckets.overdue.length > 0 ? (
          <>
            <SectionTitle>Overdue &amp; lapsed</SectionTitle>
            {buckets.overdue.map((i) => (
              <DueCard key={i.policy.id} item={i} />
            ))}
          </>
        ) : null}

        {buckets.dueThisWeek.length > 0 ? (
          <>
            <SectionTitle>Due this week</SectionTitle>
            {buckets.dueThisWeek.map((i) => (
              <DueCard key={i.policy.id} item={i} />
            ))}
          </>
        ) : null}

        {buckets.dueThisMonth.length > 0 ? (
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
  welcome: { backgroundColor: colors.white },
  welcomeScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  headerKicker: {
    color: colors.onBlackMuted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
    borderRadius: 18,
    padding: spacing.lg,
  },
  monthText: { flex: 1, paddingRight: spacing.md },
  monthTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  monthSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  monthAmount: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  stats: { gap: spacing.sm, marginTop: spacing.xs },
  overdueTile: { flex: 1.6 },
  dueRow: { justifyContent: 'space-between', marginTop: spacing.md },
  dueAmount: { fontSize: 20, fontWeight: '800', color: colors.text },
  dueDate: { fontSize: 13, color: colors.textMuted },
  overdue: { marginTop: spacing.xs, color: colors.text, fontWeight: '800', fontSize: 13 },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  recordBtn: { flex: 1 },
  muted: { color: colors.textMuted, marginHorizontal: spacing.lg, marginTop: spacing.xs },
  allMeetings: { alignSelf: 'flex-start', marginHorizontal: spacing.sm },
});
